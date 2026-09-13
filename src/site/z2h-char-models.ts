// Part of the Zero to Hero numerics. Every routine is an original implementation
// written for this course, deterministic under a seed so a number in a lesson
// can be asserted in a test. Import from ./z2h-numerics.ts, which re-exports the
// whole set as one API.

import { softmax } from "./engine.ts";
import { gaussian, rng } from "./z2h-random.ts";
import { denseForward, denseBackward, denseLoss, meanCrossEntropyRules, type DenseWeights } from "./z2h-dense-layer.ts";

// Lectures 2 and 3 — counting bigrams, then an embedding-table MLP

export interface BigramModel {
  characters: string[];
  counts: number[][];
  probabilities: number[][];
  smoothing: number;
  loss: number;
}

export const BOUNDARY = ".";

/** Inverse-CDF draw from one row of probabilities. */
function sampleIndex(row: number[], random: () => number): number {
  let draw = random();
  for (let i = 0; i < row.length; i++) {
    draw -= row[i];
    if (draw <= 0) return i;
  }
  return row.length - 1;
}

export function vocabularyOf(words: string[]): string[] {
  const letters = new Set<string>();
  for (const word of words) for (const character of word) letters.add(character);
  return [BOUNDARY, ...[...letters].sort()];
}

export function trainBigram(words: string[], smoothing = 1): BigramModel {
  const characters = vocabularyOf(words);
  const index = new Map(characters.map((c, i) => [c, i]));
  const counts = characters.map(() => characters.map(() => 0));
  for (const word of words) {
    const padded = BOUNDARY + word + BOUNDARY;
    for (let i = 0; i + 1 < padded.length; i++) counts[index.get(padded[i])][index.get(padded[i + 1])]++;
  }
  const probabilities = counts.map((row) => {
    const total = row.reduce((a, b) => a + b, 0) + smoothing * row.length;
    return row.map((c) => (c + smoothing) / total);
  });
  const model = { characters, counts, probabilities, smoothing, loss: 0 };
  model.loss = bigramLoss(model, words);
  return model;
}

/** Mean negative log likelihood per bigram: the number training must beat. */
export function bigramLoss(model: BigramModel, words: string[]): number {
  const index = new Map(model.characters.map((c, i) => [c, i]));
  let total = 0;
  let count = 0;
  for (const word of words) {
    const padded = BOUNDARY + word + BOUNDARY;
    for (let i = 0; i + 1 < padded.length; i++) {
      const from = index.get(padded[i]);
      const to = index.get(padded[i + 1]);
      if (from === undefined || to === undefined) continue;
      total -= Math.log(model.probabilities[from][to]);
      count++;
    }
  }
  return count ? total / count : 0;
}

export function sampleBigram(model: BigramModel, random: () => number, maxLength = 14): string {
  let current = 0;
  let word = "";
  for (let step = 0; step < maxLength; step++) {
    const next = sampleIndex(model.probabilities[current], random);
    if (next === 0) break;
    word += model.characters[next];
    current = next;
  }
  return word;
}

/** Uniform baseline loss: log(vocabulary size), the "learned nothing" line. */
export function uniformLoss(vocabularySize: number): number {
  return Math.log(vocabularySize);
}

const SAMPLES_PER_RUN = 6;
const MAX_SAMPLE_LENGTH = 12;

export interface MLPOptions {
  words: string[];
  context?: number;
  embedding?: number;
  hidden?: number;
  steps?: number;
  batch?: number;
  learningRate?: number;
  seed?: number;
  gain?: number;
}

export interface MLPRun {
  characters: string[];
  parameters: number;
  lossHistory: number[];
  trainLoss: number;
  heldOutLoss: number;
  embeddings: number[][];
  samples: string[];
  context: number;
  steps: number;
}

interface Dataset {
  contexts: number[][];
  targets: number[];
}

export function contextDataset(words: string[], characters: string[], context: number): Dataset {
  const index = new Map(characters.map((c, i) => [c, i]));
  const contexts: number[][] = [];
  const targets: number[] = [];
  for (const word of words) {
    let window = new Array(context).fill(0);
    for (const character of word + BOUNDARY) {
      contexts.push([...window]);
      targets.push(index.get(character));
      window = [...window.slice(1), index.get(character)];
    }
  }
  return { contexts, targets };
}

/**
 * A character MLP: context characters are looked up in an embedding table,
 * concatenated, passed through one tanh layer, then projected to vocabulary
 * logits and trained with mean cross-entropy. Small enough for a browser and
 * complete enough to show embeddings organising themselves.
 */
export function trainCharMLP(options: MLPOptions): MLPRun {
  const context = options.context ?? 3;
  const embedding = options.embedding ?? 2;
  const hidden = options.hidden ?? 24;
  const steps = options.steps ?? 400;
  const batch = options.batch ?? 16;
  const learningRate = options.learningRate ?? 0.4;
  const gain = options.gain ?? 1;
  const random = rng(options.seed ?? 1);
  const characters = vocabularyOf(options.words);
  const vocab = characters.length;
  const split = Math.max(1, Math.floor(options.words.length * 0.9));
  const train = contextDataset(options.words.slice(0, split), characters, context);
  const heldOut = contextDataset(options.words.slice(split), characters, context);

  const table = Array.from({ length: vocab }, () => Array.from({ length: embedding }, () => gaussian(random) * 0.5));
  const inputWidth = context * embedding;
  const w1 = Array.from({ length: inputWidth }, () =>
    Array.from({ length: hidden }, () => (gaussian(random) * gain) / Math.sqrt(inputWidth)),
  );
  const b1 = new Array(hidden).fill(0);
  const w2 = Array.from({ length: hidden }, () =>
    Array.from({ length: vocab }, () => (gaussian(random) * gain) / Math.sqrt(hidden)),
  );
  const b2 = new Array(vocab).fill(0);

  const weights: DenseWeights = { w1, b1, w2, b2 };

  /** Look the context up in the embedding table, then run the shared stack. */
  function forward(rows: number[][]) {
    const inputs = rows.map((row) => row.flatMap((id) => table[id]));
    return { inputs, ...denseForward(inputs, weights) };
  }

  const meanLoss = (data: Dataset) => denseLoss(forward(data.contexts).probabilities, data.targets);

  const lossHistory: number[] = [];
  for (let step = 0; step < steps; step++) {
    const rows: number[][] = [];
    const targets: number[] = [];
    for (let b = 0; b < batch; b++) {
      const pick = Math.floor(random() * train.targets.length);
      rows.push(train.contexts[pick]);
      targets.push(train.targets[pick]);
    }
    const { inputs, ...pass } = forward(rows);
    const { gradW1, gradB1, gradW2, gradB2, dInput } =
      denseBackward(inputs, pass, targets, weights, meanCrossEntropyRules(weights, batch));
    // The embedding table collects each context slot's share of the input
    // gradient, so a character used twice in one batch accumulates twice.
    const gradTable = table.map((row) => row.map(() => 0));
    rows.forEach((row, n) =>
      row.forEach((id, slot) => {
        for (let e = 0; e < embedding; e++) gradTable[id][e] += dInput[n][slot * embedding + e];
      }),
    );
    lossHistory.push(denseLoss(pass.probabilities, targets));
    for (let j = 0; j < hidden; j++) {
      b1[j] -= learningRate * gradB1[j];
      for (let k = 0; k < vocab; k++) w2[j][k] -= learningRate * gradW2[j][k];
    }
    for (let k = 0; k < vocab; k++) b2[k] -= learningRate * gradB2[k];
    for (let i = 0; i < inputWidth; i++)
      for (let j = 0; j < hidden; j++) w1[i][j] -= learningRate * gradW1[i][j];
    for (let v = 0; v < vocab; v++)
      for (let e = 0; e < embedding; e++) table[v][e] -= learningRate * gradTable[v][e];
  }

  const samples: string[] = [];
  for (let s = 0; s < SAMPLES_PER_RUN; s++) {
    let window = new Array(context).fill(0);
    let word = "";
    for (let length = 0; length < MAX_SAMPLE_LENGTH; length++) {
      const { probabilities } = forward([window]);
      const next = sampleIndex(probabilities[0], random);
      if (next === 0) break;
      word += characters[next];
      window = [...window.slice(1), next];
    }
    samples.push(word);
  }

  return {
    characters,
    parameters: vocab * embedding + inputWidth * hidden + hidden + hidden * vocab + vocab,
    lossHistory,
    trainLoss: meanLoss(train),
    heldOutLoss: meanLoss(heldOut),
    embeddings: table.map((row) => row.slice(0, 2)),
    samples,
    context,
    steps,
  };
}
