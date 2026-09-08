# Module 5: scaling, evaluation, and scientific inference

Full route: Weeks 15–18, 208 hours. Bootcamp: Weeks 10–11, 104 hours. Dependencies: Modules 3–4.

## Outcome

You can allocate a small compute budget, detect evaluation artifacts, and make a claim whose uncertainty and limits are explicit.

## Concepts to explain

An empirical loss model such as `L(N,D) = E + A/N^alpha + B/D^beta` summarizes a regime; it is not a universal law. Model/data allocation depends on objectives, data, architecture, and sometimes downstream inference costs. Read [compute-optimal training](https://arxiv.org/abs/2203.15556). Tiny sweeps are useful for learning experimental design but cannot validate frontier extrapolations.

Separate token loss, task accuracy, calibration, and generated-output judgments. Token perplexity is not directly comparable across different tokenizers. Distinguish per-example uncertainty, seed variability, and systematic dataset bias. Repeated tuning on the test set invalidates its role.

## Labs

1. Run a small grid: three model sizes and two token budgets, with pilots chosen using actual throughput. Add matched-compute pairs by trading parameters against tokens. The budget may require 1–10M models; do not force expensive sizes.
2. Fit a simple relationship, inspect residuals, and predict an omitted configuration. With six points, a five-parameter scaling fit is fragile: use constraints or a simpler fit, show sensitivity, and describe non-identifiability. Repeat selected configurations across seeds.
3. Build an evaluation entry point using a small explicit task suite and a pinned [LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness) configuration where suitable. Use arithmetic accuracy and held-out text loss if the model is too small for general benchmarks. Freeze prompts, few-shot examples, stop rules, token limits, and task versions.
4. Compare models on paired examples and bootstrap their metric difference. Report seed-level results separately. For accuracy near 0 or 1, use a boundary-aware interval such as Wilson instead of interpreting zero plug-in standard error as certainty.
5. Plant contamination and format errors. Audit answer extraction, missing/unscorable examples, cache identity, and metric denominators. Inspect at least 50 errors stratified by category.

Use the [experiment standard](../docs/07-experiments.md). An upstream evaluation bug reproduction is especially valuable here and can start earlier in the bootcamp.

## Gate

Defend a budget allocation, identify an unfair comparison, quantify uncertainty, and state one conclusion the evidence does not support. Produce a revised Project A report and an evaluation checklist another learner can use.

Stretch: calibration, robustness across source distributions, long-context evaluation, or inference-cost-aware scaling. Do not add benchmarks merely to make a table larger.

## Dedicated lab pages

- [Lab 05-01: Small scaling grid and iso-compute pairs](../site/lab.html?lab=05-01) · [Markdown guide](../docs/labs/05-01.md)
- [Lab 05-02: Fit and challenge a scaling prediction](../site/lab.html?lab=05-02) · [Markdown guide](../docs/labs/05-02.md)
- [Lab 05-03: A reproducible evaluation entry point](../site/lab.html?lab=05-03) · [Markdown guide](../docs/labs/05-03.md)
- [Lab 05-04: Paired uncertainty and seed variation](../site/lab.html?lab=05-04) · [Markdown guide](../docs/labs/05-04.md)
- [Lab 05-05: Contamination and metric-integrity audit](../site/lab.html?lab=05-05) · [Markdown guide](../docs/labs/05-05.md)
