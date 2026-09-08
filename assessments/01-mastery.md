# Mastery gates and evidence

## Common rubric

Score each dimension 0–4: 0 absent; 1 can recognize with help; 2 can implement with substantial guidance; 3 can independently implement, test, and explain; 4 can transfer, diagnose subtle failures, and critique tradeoffs.

| Dimension | Evidence |
| --- | --- |
| Mathematical understanding | Derive the objective, shapes, gradients, assumptions |
| Implementation | Correct independent code on a fresh small case |
| Debugging | Diagnose an injected failure with discriminating tests |
| Experimental judgment | Fair baseline, uncertainty, leakage controls, bounded claim |
| Communication/reproducibility | Another person can understand and rerun the result |

**Module pass:** at least 3 in every applicable dimension, with specific evidence links and no unresolved critical correctness issue. An impressive benchmark cannot offset contaminated evaluation or incorrect gradients. “Not applicable” needs a reason. A tutor’s opinion alone is not an independent external endorsement.

## Required gates

| Module | Fresh assessment |
| --- | --- |
| Foundations | Derive and numerically verify a loss gradient; debug a broken small training loop |
| Transformer | Build a new tiny causal block, verify masking and shift, explain numerical stability |
| Pretraining | Audit an unfamiliar shard, catch leakage, resume a run, interpret loss curves |
| Systems | Explain a profiler trace; show kernel parity and actual multi-GPU gradient equivalence |
| Scaling/evaluation | Design an iso-compute comparison, quantify uncertainty, challenge an extrapolation |
| SFT | Verify assistant-token labels; diagnose a template/masking mistake and capability regression |
| RL foundations | Compare a sampled gradient with exact bandit expectation; debug terminal handling |
| RLHF/preferences | Implement DPO on a toy case, explain PPO policy roles, expose reward exploitation |
| Reasoning RL | Validate a reward checker, test zero-variance groups, compare at fixed inference budget |
| Capstone | Defend a reproducible controlled result, including limitations and a falsifying test |

## Final practical examination

Across the last week, spend 3 hours on a new implementation/debugging task, 2 hours designing and piloting an experiment under a fixed budget, and 1 hour defending the capstone and diagnosing an unfamiliar failure. Use existing final-week hours. No AI during the independent portions; review afterward.

For bootcamp completion, pass all required gates and deliver Projects A–D. If hardware work is unperformed, report “conceptual track complete; accelerator systems gate pending.” External review status should remain visible even when all internal technical gates pass.

## Career readiness is a separate judgment

The technical rubric measures course skills. A frontier-lab application also depends on role-specific depth, collaboration, interview performance, and the credibility of prior work. Track external reproduction, adopted contributions, and production experience separately. Do not turn this rubric into a salary predictor.
