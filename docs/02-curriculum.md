# Curriculum and dependencies

**Experienced engineers:** use the [24-week bootcamp](00-personalized-bootcamp.md) as the primary schedule. The table below is the fuller 40-week route for learners who need more implementation practice. Both routes use the same core module specifications and assessments.

The sequence is foundations → transformer → pretraining → systems → scaling/evaluation → SFT → RL → preferences/RLHF → reasoning RL → research. Evaluation begins during pretraining and is deepened later. Do not wait until the evaluation module to create held-out data.

Weeks 1 to 6 pair well with the [Zero to Hero companion track](18-zero-to-hero.md): lectures 1 to 6 during foundations, lectures 7 and 8 during the transformer module, and lecture 9 as preparation for pretraining and systems. The lectures build fluency; the weekly deliverables below remain the assessed work.

## Full 40-week route

| Week | Main work | Weekly deliverable |
| --- | --- | --- |
| 1 | [Foundations](../modules/01-foundations.md): diagnostic, gradients, probability | Gradient checks and placement record |
| 2 | Training dynamics, MLP/CNN, PyTorch | Controlled optimizer comparison and foundations gate |
| 3 | [Transformer](../modules/02-transformer.md): byte tokenizer and BPE | Round-trip, deterministic merge, held-out tokenization tests |
| 4 | Attention and decoder | Shape ledger, causal invariance, reference checks |
| 5 | Training loop and numerics | Tiny-batch overfit, finite-gradient checks, resume |
| 6 | Tiny LM integration | Reproduction report and transformer gate |
| 7 | [Pretraining](../modules/03-pretraining.md): collection and aggregation | Source manifests, streaming shards, split assignment |
| 8 | Filtering and deduplication | Curation audit and contamination probes |
| 9 | Pretraining recipes and diagnostics | Baseline and matched-budget ablation |
| 10 | Recovery and report | Project A release and human review request |
| 11 | [Systems](../modules/04-systems.md): resource accounting | Memory/FLOP estimates and profiler trace |
| 12 | Kernel/loop optimization | Correctness parity and measured performance |
| 13 | DDP/FSDP | Gradient parity and scaling/memory table |
| 14 | Distributed reliability | Failure injection and Project B release |
| 15 | [Scaling/evaluation](../modules/05-scaling-evaluation.md): scaling laws | Pilot sweep and compute forecast |
| 16 | Iso-compute study | Fit, residuals, held-out prediction |
| 17 | Evaluation harness and uncertainty | Task suite, paired intervals, leakage audit |
| 18 | Error analysis and research question | Revised Project A; external review request |
| 19 | [SFT](../modules/06-sft.md): masks and datasets | Supervised baseline with verified labels |
| 20 | Full versus adapter tuning | Matched comparison and memory report |
| 21 | SFT data/behavior study | Frozen reference and capability regression report |
| 22 | [RL](../modules/07-rl.md): MDPs and bandits | Exact policy-gradient comparison |
| 23 | REINFORCE and actor-critic | Variance experiment and return diagnostics |
| 24 | PPO and GAE | Correct toy PPO with terminal/truncation tests |
| 25 | [Alignment](../modules/08-alignment.md): preferences and reward | Reward-model validation and label audit |
| 26 | DPO | Verified loss and beta/noise experiment |
| 27 | Text PPO | Rollout/update integration and KL diagnostics |
| 28 | Alignment failures | SFT/DPO/PPO report and review request |
| 29 | [Reasoning RL](../modules/09-reasoning-rl.md): verifiers and tasks | Held-out generator, verifier adversarial tests |
| 30 | Group-relative policy optimization | Independent toy implementation and sanity checks |
| 31 | Rollout systems | Versioned batched pipeline and staleness analysis |
| 32 | Controlled reasoning study | Project C release, pass@1/cost results |
| 33 | [Research](../modules/10-research.md): specialization and literature | Registered question and prior-work table |
| 34 | Baseline reproduction | Reproducible baseline and go/no-go decision |
| 35 | Main intervention | First controlled comparison |
| 36 | Mechanism tests | Ablations and failure analysis |
| 37 | Replication and transfer | Seeds and one additional setting |
| 38 | External contribution | Maintainer-facing patch or reviewed reproduction |
| 39 | Paper/report and interviews | Draft report, code audit, mock interview |
| 40 | Independent rerun and defense | Final evidence package and revised career plan |

## Common weekly rhythm

Monday: derive the mechanism and specify the experiment. Tuesday–Wednesday: implement and debug small cases. Thursday: run the cheapest valid comparison. Friday: analyze, write, and repair. Saturday: independent challenge, oral review, and planning. See the [daily schedule](01-timeline.md) for hours.

Each module contains concepts, exercises, readings, a completion gate, and fallback scope. Its nominal weeks apply only to the full route. The bootcamp table explicitly allocates compressed weeks; its three-week capstone refines an existing project instead of launching a broad new research program.

## Completion criteria

Pass all foundational gates and the four [portfolio project specifications](../projects/README.md). Hardware-dependent gates remain pending until measured on the required hardware. Record missing human review separately from technical completion. A bootcamp completion means the specified capabilities were demonstrated; it is not a research credential or evidence of frontier-scale operation.
