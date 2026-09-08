# Portfolio and bootcamp projects

Build these incrementally from the modules. They are assignment specifications; their implementations and results do not exist yet. Proposed directories below should be created as the learner begins each project. Upstream work meeting the same requirements can replace a local component.

## Project A: data to pretrained model

Proposed location: `projects/pretraining/`. Bootcamp Weeks 2–5 and 10–11.

Question: how does an explicit curation choice affect held-out performance under a fixed training-token budget?

Deliver a tokenizer/decoder/trainer, two-source manifest, streaming data pipeline, duplicate/contamination audit, baseline and intervention configurations, three small-run seeds, checkpoint recovery, per-source metrics, and a concise report. Start at 10–50M parameters with 20–100M tokens/run only if pilots fit the work budget. A smaller model is valid if necessary.

Acceptance: all core loss/mask/optimizer tests pass; counts reconcile; test data is protected; a clean environment reproduces a small result; the claim is supported even if the intervention loses. Do not claim the small model is frontier-competitive.

## Project B: measured training systems improvement

Proposed location: `projects/systems/`. Bootcamp Weeks 6–9.

Question: what is the measured bottleneck and what intervention improves time, memory, or reliability?

Deliver a resource ledger, profiler traces, one verified custom kernel, before/after loop benchmarks, one/two-GPU gradient equivalence, DDP/FSDP measurements, and a fault/restart report. On the provided hardware, include separate 5090, 5080, and two-PC measurements. Mark unrun configurations clearly.

Acceptance: reference parity, reproducible timing methodology, fixed workload, documented unsupported shapes, and a causal explanation for performance differences. No minimum speedup is required; a diagnosed slowdown can demonstrate expertise. Actual accelerator measurements are mandatory for the hardware gate.

## Project C: post-training with reliable evaluation

Proposed location: `projects/posttraining/`. Bootcamp Weeks 12–21.

Question: which changes improve held-out task success, and where does reward optimization diverge from it?

Deliver SFT, pairwise reward modeling, DPO, tiny text PPO, and a small RLVR study. Use one frozen SFT reference where meaningful. Include loss/gradient checks, preference-noise and reward-hacking examples, verifier tests, seeds, inference-budget controls, and versioned rollout metadata.

Acceptance: distinguish old/current/reference policies; show valid response masking; report base/SFT/post-training metrics on held-out tasks; count rollout cost and invalid outputs; defend a positive or null result. Do not require large-model PPO if a tiny policy establishes algorithm correctness and the resource limitation is explicit.

## Project D: capstone or adopted contribution

Proposed location: `projects/capstone/`. Bootcamp Weeks 22–24, using an existing baseline.

Choose one narrow extension from Module 10 or an upstream defect encountered in A/B/C. Deliver a prior-work note, registered comparison, baseline reproduction, controlled intervention, final report, independent practical defense, and externally reviewable artifact.

Acceptance: one clear claim, reproducible evidence, honest limits, and readiness for substantive external review. A merged contribution is valuable but cannot be a mandatory timed outcome because maintainers control it. Track preparation, submission, review, and adoption separately.

## Report size and review

Aim for 2–4 pages per project in Markdown, with detailed configs and tables linked. A reviewer should find the question, main finding, exact reproduction instructions, and limitations within two minutes. Use the [report template](../templates/experiment.md) and [mastery rubric](../assessments/01-mastery.md).
