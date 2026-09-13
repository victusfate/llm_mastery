// One tanh hidden layer into softmax cross-entropy, forward and backward.
//
// Two lessons need exactly this stack: the character MLP trains it, and the
// gradient check differentiates it by hand against finite differences. The
// backward pass takes its rules as arguments so the check can supply a
// deliberately wrong one and watch the comparison catch it.

import { softmax } from "./engine.ts";

export interface DenseWeights {
  w1: number[][];
  b1: number[];
  w2: number[][];
  b2: number[];
}

export interface DensePass {
  hidden: number[][];
  probabilities: number[][];
}

export function denseForward(inputs: number[][], weights: DenseWeights): DensePass {
  const width = weights.b1.length;
  const classes = weights.b2.length;
  const hidden = inputs.map((row) => {
    const activations = new Array(width).fill(0);
    for (let j = 0; j < width; j++) {
      let sum = weights.b1[j];
      for (let i = 0; i < row.length; i++) sum += row[i] * weights.w1[i][j];
      activations[j] = Math.tanh(sum);
    }
    return activations;
  });
  const probabilities = hidden.map((activations) => {
    const logits = new Array(classes).fill(0);
    for (let k = 0; k < classes; k++) {
      let sum = weights.b2[k];
      for (let j = 0; j < width; j++) sum += activations[j] * weights.w2[j][k];
      logits[k] = sum;
    }
    return softmax(logits);
  });
  return { hidden, probabilities };
}

/** Mean negative log likelihood of the target class over the batch. */
export function denseLoss(probabilities: number[][], targets: number[]): number {
  if (!targets.length) return 0;
  const total = probabilities.reduce(
    (sum, row, n) => sum - Math.log(Math.max(row[targets[n]], 1e-12)),
    0,
  );
  return total / targets.length;
}

export interface BackwardRules {
  /** Applied to every logit gradient; 1/batch for a mean loss. */
  scale: number;
  /** Gradient of the loss with respect to one logit. */
  logitGradient(probability: number, isTarget: boolean): number;
  /** Which weight carries gradient from logit k back to hidden unit j. */
  hiddenWeight(j: number, k: number): number;
}

/** The correct derivation: mean cross-entropy through the forward weights. */
export const meanCrossEntropyRules = (weights: DenseWeights, batch: number): BackwardRules => ({
  scale: 1 / batch,
  logitGradient: (probability, isTarget) => probability - (isTarget ? 1 : 0),
  hiddenWeight: (j, k) => weights.w2[j][k],
});

export interface DenseGradients {
  gradW1: number[][];
  gradB1: number[];
  gradW2: number[][];
  gradB2: number[];
  /** Gradient with respect to the inputs, for whatever produced them. */
  dInput: number[][];
}

export function denseBackward(
  inputs: number[][],
  pass: DensePass,
  targets: number[],
  weights: DenseWeights,
  rules: BackwardRules,
): DenseGradients {
  const width = weights.b1.length;
  const classes = weights.b2.length;
  const inputWidth = weights.w1.length;
  const gradW1 = weights.w1.map((row) => row.map(() => 0));
  const gradB1 = new Array(width).fill(0);
  const gradW2 = weights.w2.map((row) => row.map(() => 0));
  const gradB2 = new Array(classes).fill(0);
  const dInput: number[][] = [];

  for (let n = 0; n < inputs.length; n++) {
    const activations = pass.hidden[n];
    const dLogits = pass.probabilities[n].map((probability, k) =>
      rules.logitGradient(probability, k === targets[n]) * rules.scale,
    );
    const dHidden = new Array(width).fill(0);
    for (let j = 0; j < width; j++)
      for (let k = 0; k < classes; k++) {
        gradW2[j][k] += activations[j] * dLogits[k];
        dHidden[j] += rules.hiddenWeight(j, k) * dLogits[k];
      }
    for (let k = 0; k < classes; k++) gradB2[k] += dLogits[k];
    // tanh's local derivative, taken from its output rather than recomputed.
    const dPre = dHidden.map((gradient, j) => gradient * (1 - activations[j] * activations[j]));
    const row = new Array(inputWidth).fill(0);
    for (let i = 0; i < inputWidth; i++)
      for (let j = 0; j < width; j++) {
        gradW1[i][j] += inputs[n][i] * dPre[j];
        row[i] += weights.w1[i][j] * dPre[j];
      }
    for (let j = 0; j < width; j++) gradB1[j] += dPre[j];
    dInput.push(row);
  }
  return { gradW1, gradB1, gradW2, gradB2, dInput };
}
