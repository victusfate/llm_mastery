// Part of the Zero to Hero numerics. Every routine is an original implementation
// written for this course, deterministic under a seed so a number in a lesson
// can be asserted in a test. Import from ./z2h-numerics.ts, which re-exports the
// whole set as one API.

// Lecture 9 — parameter, compute, and schedule arithmetic before renting a GPU

export interface ParameterBreakdown {
  embedding: number;
  positional: number;
  attention: number;
  feedForward: number;
  total: number;
}

/** Parameter count of a GPT-2 style decoder with tied input/output embeddings. */
export function parameterCount(options: {
  layers?: number;
  width?: number;
  vocabulary?: number;
  context?: number;
  expansion?: number;
}): ParameterBreakdown {
  const layers = options.layers ?? 12;
  const width = options.width ?? 768;
  const vocabulary = options.vocabulary ?? 50257;
  const context = options.context ?? 1024;
  const expansion = options.expansion ?? 4;
  const attention = layers * (4 * width * width + 4 * width);
  const feedForward = layers * (2 * expansion * width * width + expansion * width + width);
  const norms = layers * 4 * width + 2 * width;
  return {
    embedding: vocabulary * width,
    positional: context * width,
    attention,
    feedForward,
    total: vocabulary * width + context * width + attention + feedForward + norms,
  };
}

export interface Budget {
  flops: number;
  hours: number;
  dollars: number;
  tokensPerParameter: number;
  chinchillaOptimalTokens: number;
}

/**
 * Training compute is estimated as 6 · parameters · tokens (forward plus
 * backward), the standard approximation from the scaling-law literature — an
 * estimate for planning, not a measured runtime. Achieved throughput is the
 * device peak multiplied by model FLOPs utilisation.
 */
export function trainingBudget(options: {
  parameters: number;
  tokens: number;
  deviceTflops?: number;
  utilisation?: number;
  dollarsPerHour?: number;
}): Budget {
  const deviceTflops = options.deviceTflops ?? 100;
  const utilisation = options.utilisation ?? 0.4;
  const dollarsPerHour = options.dollarsPerHour ?? 2;
  const flops = 6 * options.parameters * options.tokens;
  const hours = flops / (deviceTflops * 1e12 * utilisation) / 3600;
  return {
    flops,
    hours,
    dollars: hours * dollarsPerHour,
    tokensPerParameter: options.tokens / options.parameters,
    chinchillaOptimalTokens: 20 * options.parameters,
  };
}

/** Linear warmup then cosine decay, the schedule used by GPT-2 reproductions. */
export function learningRateSchedule(options: {
  steps?: number;
  warmup?: number;
  peak?: number;
  floorFraction?: number;
}): number[] {
  const steps = options.steps ?? 100;
  const warmup = Math.min(options.warmup ?? 10, steps);
  const peak = options.peak ?? 6e-4;
  const floor = peak * (options.floorFraction ?? 0.1);
  return Array.from({ length: steps }, (_, step) => {
    if (step < warmup) return (peak * (step + 1)) / warmup;
    const progress = (step - warmup) / Math.max(1, steps - warmup);
    return floor + 0.5 * (peak - floor) * (1 + Math.cos(Math.PI * progress));
  });
}
