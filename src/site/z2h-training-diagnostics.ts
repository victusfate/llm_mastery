// Part of the Zero to Hero numerics. Every routine is an original implementation
// written for this course, deterministic under a seed so a number in a lesson
// can be asserted in a test. Import from ./z2h-numerics.ts, which re-exports the
// whole set as one API.

import { softmax } from "./engine.ts";
import { gaussian, rng } from "./z2h-random.ts";
import { denseForward, denseBackward, denseLoss, meanCrossEntropyRules, type BackwardRules, type DenseWeights } from "./z2h-dense-layer.ts";

/** Beyond this magnitude a tanh unit is flat enough that its gradient vanishes. */
export const SATURATION_THRESHOLD = 0.97;

// Lectures 4 and 5 — initialisation statistics, and hand-derived gradients

export interface LayerDiagnostics {
  layer: number;
  activationStd: number;
  saturatedFraction: number;
  gradientStd: number;
  histogram: number[];
}

export interface InitialisationReport {
  layers: LayerDiagnostics[];
  gain: number;
  normalised: boolean;
  alwaysSaturatedFraction: number;
}

/**
 * Forward a batch through `depth` tanh layers initialised as
 * gaussian * gain / sqrt(fan-in), then push a unit gradient back. Saturation
 * and vanishing gradients become visible before any training happens.
 */
export function initialisationDiagnostics(options: {
  depth?: number;
  width?: number;
  batch?: number;
  gain?: number;
  normalised?: boolean;
  seed?: number;
  bins?: number;
}): InitialisationReport {
  const depth = options.depth ?? 5;
  const width = options.width ?? 32;
  const batch = options.batch ?? 64;
  const gain = options.gain ?? 1;
  const normalised = options.normalised ?? false;
  const bins = options.bins ?? 17;
  const random = rng(options.seed ?? 3);
  const weights = Array.from({ length: depth }, () =>
    Array.from({ length: width }, () => Array.from({ length: width }, () => (gaussian(random) * gain) / Math.sqrt(width))),
  );
  let activations = Array.from({ length: batch }, () => Array.from({ length: width }, () => gaussian(random)));
  const forwardActivations: number[][][] = [];
  const preActivations: number[][][] = [];
  for (let l = 0; l < depth; l++) {
    let pre = activations.map((row) => {
      const out = new Array(width).fill(0);
      for (let j = 0; j < width; j++) {
        let sum = 0;
        for (let i = 0; i < width; i++) sum += row[i] * weights[l][i][j];
        out[j] = sum;
      }
      return out;
    });
    if (normalised) {
      // Batch normalisation over the batch dimension, gain 1 and shift 0.
      for (let j = 0; j < width; j++) {
        const column = pre.map((row) => row[j]);
        const mean = column.reduce((a, b) => a + b, 0) / batch;
        const variance = column.reduce((a, b) => a + (b - mean) ** 2, 0) / batch;
        const scale = 1 / Math.sqrt(variance + 1e-5);
        for (const row of pre) row[j] = (row[j] - mean) * scale;
      }
    }
    preActivations.push(pre);
    activations = pre.map((row) => row.map(Math.tanh));
    forwardActivations.push(activations);
  }
  // Seed the backward pass so the incoming gradient has unit norm per example,
  // which keeps the per-layer numbers comparable as the width changes.
  let gradient = activations.map((row) => row.map(() => 1 / Math.sqrt(width)));
  const gradientStds: number[] = [];
  for (let l = depth - 1; l >= 0; l--) {
    const dPre = gradient.map((row, n) => row.map((g, j) => g * (1 - forwardActivations[l][n][j] ** 2)));
    const flat = dPre.flat();
    gradientStds[l] = Math.sqrt(flat.reduce((a, b) => a + b * b, 0) / flat.length);
    gradient = dPre.map((row) => {
      const out = new Array(width).fill(0);
      for (let i = 0; i < width; i++) {
        let sum = 0;
        for (let j = 0; j < width; j++) sum += row[j] * weights[l][i][j];
        out[i] = sum;
      }
      return out;
    });
  }
  const layers = forwardActivations.map((layerActivations, l) => {
    const flat = layerActivations.flat();
    const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
    const histogram = new Array(bins).fill(0);
    for (const value of flat) {
      const bin = Math.min(bins - 1, Math.max(0, Math.floor(((value + 1) / 2) * bins)));
      histogram[bin]++;
    }
    return {
      layer: l + 1,
      activationStd: Math.sqrt(flat.reduce((a, b) => a + (b - mean) ** 2, 0) / flat.length),
      saturatedFraction: flat.filter((v) => Math.abs(v) > SATURATION_THRESHOLD).length / flat.length,
      gradientStd: gradientStds[l],
      histogram: histogram.map((count) => count / flat.length),
    };
  });
  const last = forwardActivations[depth - 1];
  const alwaysSaturatedFraction =
    Array.from({ length: width }, (_, j) => last.every((row) => Math.abs(row[j]) > SATURATION_THRESHOLD)).filter(Boolean).length / width;
  return { layers, gain, normalised, alwaysSaturatedFraction };
}

export type GradientRule = "correct" | "no-batch-mean" | "no-onehot" | "transposed-hidden";

export interface GradientCheck {
  rule: GradientRule;
  entries: { name: string; maxError: number; passed: boolean }[];
  passed: boolean;
  explanation: string;
}

const RULE_NOTES: Record<GradientRule, string> = {
  correct: "Every tensor matches the finite-difference reference to roughly 1e-7.",
  "no-batch-mean": "Dropping the 1/batch factor scales every gradient by the batch size; the loss still falls, so only a check catches it.",
  "no-onehot": "Without subtracting the one-hot target, the logit gradient pushes all classes down and never up.",
  "transposed-hidden": "Using the forward weight orientation on the way back corrupts the earlier layers while the last layer still checks out.",
};

/**
 * A two-layer tanh network with softmax cross-entropy, differentiated by hand
 * under a chosen rule, then compared with central differences. The deliberately
 * wrong rules reproduce the mistakes that survive training and fail a check.
 */
export function gradientCheck(rule: GradientRule = "correct", seed = 7, tolerance = 1e-5): GradientCheck {
  const random = rng(seed);
  const batch = 4;
  const inputs = 3;
  const hidden = 4;
  const classes = 3;
  const x = Array.from({ length: batch }, () => Array.from({ length: inputs }, () => gaussian(random)));
  const labels = Array.from({ length: batch }, () => Math.floor(random() * classes));
  const w1 = Array.from({ length: inputs }, () => Array.from({ length: hidden }, () => gaussian(random) * 0.6));
  const b1 = Array.from({ length: hidden }, () => gaussian(random) * 0.1);
  const w2 = Array.from({ length: hidden }, () => Array.from({ length: classes }, () => gaussian(random) * 0.6));
  const b2 = Array.from({ length: classes }, () => gaussian(random) * 0.1);

  const weights: DenseWeights = { w1, b1, w2, b2 };
  const forward = () => {
    const pass = denseForward(x, weights);
    return { pass, loss: denseLoss(pass.probabilities, labels) };
  };

  /** The three wrong rules differ from the correct one in exactly one place. */
  const rules: BackwardRules = {
    ...meanCrossEntropyRules(weights, batch),
    ...(rule === "no-batch-mean" ? { scale: 1 } : {}),
    ...(rule === "no-onehot" ? { logitGradient: (probability: number) => probability } : {}),
    // The transposed rule indexes the forward orientation on the backward path,
    // a mistake that only shows up in the earlier layer.
    ...(rule === "transposed-hidden"
      ? { hiddenWeight: (j: number, k: number) => w2[(k * hidden + j) % hidden][j % classes] }
      : {}),
  };

  const { gradW1, gradB1, gradW2, gradB2 } =
    denseBackward(x, forward().pass, labels, weights, rules);

  const numeric = (set: (delta: number) => void) => {
    const step = 1e-5;
    set(step);
    const high = forward().loss;
    set(-2 * step);
    const low = forward().loss;
    set(step);
    return (high - low) / (2 * step);
  };
  const compare = (entry: {
    name: string;
    analytic: number[][] | number[];
    write: (i: number, j: number, delta: number) => void;
    rows: number;
    columns: number;
  }) => {
    const { name, analytic, write, rows, columns } = entry;
    let maxError = 0;
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < columns; j++) {
        const reference = numeric((delta) => write(i, j, delta));
        const value = Array.isArray(analytic[i]) ? (analytic as number[][])[i][j] : (analytic as number[])[j];
        maxError = Math.max(maxError, Math.abs(value - reference));
      }
    return { name, maxError, passed: maxError < tolerance };
  };

  const entries = [
    compare({ name: "W1", analytic: gradW1, rows: inputs, columns: hidden, write: (i, j, d) => {
      w1[i][j] += d;
    } }),
    compare({ name: "b1", analytic: gradB1, rows: 1, columns: hidden, write: (_i, j, d) => {
      b1[j] += d;
    } }),
    compare({ name: "W2", analytic: gradW2, rows: hidden, columns: classes, write: (i, j, d) => {
      w2[i][j] += d;
    } }),
    compare({ name: "b2", analytic: gradB2, rows: 1, columns: classes, write: (_i, j, d) => {
      b2[j] += d;
    } }),
  ];
  return { rule, entries, passed: entries.every((e) => e.passed), explanation: RULE_NOTES[rule] };
}
