// Part of the Zero to Hero numerics. Every routine is an original implementation
// written for this course, deterministic under a seed so a number in a lesson
// can be asserted in a test. Import from ./z2h-numerics.ts, which re-exports the
// whole set as one API.

import { softmax } from "./engine.ts";
import { gaussian, rng } from "./z2h-random.ts";

// Lectures 6 and 7 — hierarchical context, and one causal attention head

/** How many doublings of the context the comparison table covers. */
const SCALING_HORIZON = 8;

export interface ContextPlan {
  depth: number;
  fanIn: number;
  contextLength: number;
  groupsPerLayer: number[];
  flatParameters: number;
  hierarchicalParameters: number;
  /** How both designs grow as the context doubles, including the crossover. */
  scaling: { depth: number; contextLength: number; flat: number; hierarchical: number }[];
}

/**
 * A tree of fan-in `fanIn` repeated `depth` times sees fanIn^depth positions.
 * The comparison shows why widening the context by concatenating everything
 * into one layer becomes the expensive option.
 */
export function contextPlan(options: {
  depth?: number;
  fanIn?: number;
  embedding?: number;
  hidden?: number;
}): ContextPlan {
  const depth = options.depth ?? 3;
  const fanIn = options.fanIn ?? 2;
  const embedding = options.embedding ?? 16;
  const hidden = options.hidden ?? 64;
  const contextLength = fanIn ** depth;
  const groupsPerLayer = Array.from({ length: depth }, (_, l) => contextLength / fanIn ** (l + 1));
  // One wide layer pays for every context position at once; a tree pays per
  // level, so the two curves cross at a context length worth locating.
  const flat = (positions: number) => positions * embedding * hidden + hidden;
  const hierarchical = (levels: number) =>
    fanIn * embedding * hidden + hidden + (levels - 1) * (fanIn * hidden * hidden + hidden);
  return {
    depth,
    fanIn,
    contextLength,
    groupsPerLayer,
    flatParameters: flat(contextLength),
    hierarchicalParameters: hierarchical(depth),
    scaling: Array.from({ length: SCALING_HORIZON }, (_, i) => ({
      depth: i + 1,
      contextLength: fanIn ** (i + 1),
      flat: flat(fanIn ** (i + 1)),
      hierarchical: hierarchical(i + 1),
    })),
  };
}

export interface AttentionResult {
  tokens: string[];
  weights: number[][];
  rowSums: number[];
  outputs: number[][];
  causal: boolean;
  earlierPositionDrift: number;
}

function tokenEmbedding(token: string, position: number, width: number, random: () => number): number[] {
  // Content depends on the token text, position on the index: changing a token
  // changes its row only, which is what the invariance check relies on.
  const content = rng([...token].reduce((a, c) => a + c.charCodeAt(0), 17));
  return Array.from({ length: width }, () => gaussian(content) * 0.8 + Math.sin(position + 1) * 0.3 + gaussian(random) * 0.05);
}

export function selfAttention(options: {
  tokens: string[];
  headDim?: number;
  causal?: boolean;
  temperature?: number;
  seed?: number;
}): AttentionResult {
  const tokens = options.tokens;
  const headDim = options.headDim ?? 8;
  const causal = options.causal ?? true;
  const temperature = options.temperature ?? 1;
  const seed = options.seed ?? 11;
  const run = (sequence: string[]) => {
    const random = rng(seed);
    const embeddings = sequence.map((token, i) => tokenEmbedding(token, i, headDim, random));
    const projection = () =>
      Array.from({ length: headDim }, () => Array.from({ length: headDim }, () => gaussian(random) / Math.sqrt(headDim)));
    const wq = projection();
    const wk = projection();
    const wv = projection();
    const project = (matrix: number[][]) =>
      embeddings.map((row) =>
        Array.from({ length: headDim }, (_, j) => row.reduce((sum, value, i) => sum + value * matrix[i][j], 0)),
      );
    const q = project(wq);
    const k = project(wk);
    const v = project(wv);
    const weights = q.map((query, i) => {
      const scores = k.map((key, j) =>
        causal && j > i
          ? -Infinity
          : query.reduce((sum, value, d) => sum + value * key[d], 0) / (Math.sqrt(headDim) * temperature),
      );
      return softmax(scores.map((s) => (s === -Infinity ? -1e9 : s)));
    });
    const outputs = weights.map((row) =>
      Array.from({ length: headDim }, (_, d) => row.reduce((sum, weight, j) => sum + weight * v[j][d], 0)),
    );
    return { weights, outputs };
  };
  const { weights, outputs } = run(tokens);
  // Replace the final token and measure how much earlier outputs moved. Causal
  // attention must report zero; remove the mask and it will not.
  const altered = [...tokens.slice(0, -1), tokens[tokens.length - 1] + "?"];
  const shifted = run(altered);
  let earlierPositionDrift = 0;
  for (let i = 0; i < tokens.length - 1; i++)
    for (let d = 0; d < headDim; d++)
      earlierPositionDrift = Math.max(earlierPositionDrift, Math.abs(outputs[i][d] - shifted.outputs[i][d]));
  return {
    tokens,
    weights,
    rowSums: weights.map((row) => row.reduce((a, b) => a + b, 0)),
    outputs,
    causal,
    earlierPositionDrift,
  };
}
