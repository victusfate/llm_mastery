# Experiment and reproducibility standard

## Before a run

Write the question, hypothesis, primary metric, baseline, intervention, controlled variables, split policy, seed list, and budget. Define a stop condition for correctness failures and spending. Record what would count as improvement, no effect, or a failed experiment.

Keep data retrieval revision, source/rights metadata, hashes, tokenizer revision, code commit, dependency versions, complete configuration, precision, hardware, and exact launch command. Save results without raw private data or credentials.

## Correctness ladder

1. Hand-computable case or exact enumeration.
2. Numerical gradient/reference parity where relevant.
3. Tiny-batch overfit or known-optimum environment.
4. End-to-end smoke including evaluation and checkpoint reload.
5. Pilot resource measurement.
6. Full controlled comparison.

Set numerical tolerances based on dtype, operation, and expected roundoff. Document them before inspecting whether a desired result passes. Disable randomness for initial parity; separately test realistic stochastic training.

## Fairness and leakage

State whether a comparison fixes tokens, steps, FLOPs, wall time, money, or inference budget. These are different questions. Keep architectures and optimizers fixed when testing data; use appropriate tuned baselines when claiming optimizer superiority. Count generated RL tokens as well as update tokens.

Partition at document/group/template level appropriate to the task. Audit duplicate groups and test contamination. Fit tokenizers and tunable filters on permitted training material. Preserve the test set until the final comparison; use validation for iteration. Log every exclusion and the metric denominator, including invalid/unscorable samples.

## Uncertainty and claims

Use at least three seeds for the small version of the main stochastic comparison when feasible. If only one large run fits, label it exploratory and repeat a smaller configuration. Report individual seed results, mean and spread; example-level bootstrap intervals are not a substitute for between-run variability.

For paired evaluations, resample paired examples when estimating metric differences. Inspect boundary cases for accuracy intervals. Avoid declaring success from overlapping or non-overlapping intervals alone without stating the inferential procedure. Report the size of the effect and plausible confounds.

Publish negative results and failed seeds with diagnosis. A small corpus or toy environment can demonstrate an implementation or mechanism; it cannot establish a general capability or scaling claim. Do not call a training reward curve an evaluation result.

## Performance

Report shapes, batch/sequence sizes, dtypes, warmup, compilation cost, synchronized timing method, device topology, and repeated measurements. Separate kernel speed from end-to-end speed. Compare correctness and resulting training behavior. A slower but more memory-efficient configuration may still be useful; state the tradeoff.

## Artifact handoff

Provide a CPU/minimal reproduction where possible, the actual run commands, results table, retrieval instructions for external assets, and expected metrics/tolerances. Keep large artifacts out of Git. Have someone else rerun a representative result; if only the tutor reviewed it, state that explicitly.

Use [templates](../templates/README.md) and record assistance level. Never fill a report with plausible numbers before a run exists.
