// The Zero to Hero numerics, as one API.
//
// Every routine here is an original implementation written for this course so
// that the workbench can compute the quantities a learner is about to build in
// Python. No code from the referenced lectures, notebooks, or repositories is
// copied; the mechanisms are re-derived from their published descriptions and
// from the primary papers cited in docs/06-resources.md.
//
// The implementations live in one module per topic; this barrel re-exports them
// so the sandbox worker, the panels, and the learner-facing `z2h.*` namespace
// see a single flat API.

export { rng, gaussian } from "./z2h-random.ts";
export * from "./z2h-autograd-expression.ts";
export * from "./z2h-autograd-value.ts";
export * from "./z2h-char-models.ts";
export * from "./z2h-training-diagnostics.ts";
export * from "./z2h-architecture.ts";
export * from "./z2h-tokenizer.ts";
export * from "./z2h-scaling.ts";
