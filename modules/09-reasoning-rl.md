# Module 9: verifiable rewards, reasoning, and rollout systems

Full route: Weeks 29–32, 208 hours. Bootcamp: Weeks 19–21, 156 hours. Dependencies: text PPO and reliable evaluation.

## Outcome

A small reasoning-RL experiment with an independently tested verifier and a rollout pipeline that records which policy generated every sample.

## Concepts to explain

RL with verifiable rewards (RLVR) replaces a learned or human preference signal with a task checker where that is appropriate. The checker is part of the learning system; exploitability and parsing mistakes can dominate results.

For a simple group-relative estimator, sample G responses to a prompt and compute `A_i = (r_i - mean(r)) / (std(r) + epsilon)`. Specify the standard-deviation convention and treatment of equal-reward groups. This formula alone is not the complete GRPO algorithm: the policy-ratio surrogate, token/sequence reduction, clipping, reference penalty, rollout reuse, and sampling distribution also matter. Read [DeepSeekMath](https://arxiv.org/abs/2402.03300) and [DeepSeek-R1](https://arxiv.org/abs/2501.12948); pin the paper version and variant you implement.

Learn rollout batching, generation throughput, KV-cache pressure, policy weight synchronization, stale trajectories, token budgets, pass@1 versus pass@k, reward sparsity, collapse, distillation, and train/inference distribution mismatch. Inspect [verl](https://github.com/verl-project/verl) after the small reference implementation works.

## Labs

1. Generate arithmetic tasks with exact answers and disjoint training/evaluation templates and lengths. Implement answer extraction and a deterministic verifier. Test malformed, empty, repeated, contradictory, and overly long outputs; do not let “contains the answer somewhere” pass.
2. Establish base, SFT, and best-of-k sampling baselines with recorded generation cost. Ensure the task is learnable: if almost every rollout has the same reward, adjust the training difficulty or SFT warm start without inspecting test answers.
3. Implement a small group-relative update with a fixed documented reduction. Test equal rewards, singleton groups, masks, gradient direction, and rollout/current policy ratios. Keep the fixed reference separate from old-policy snapshots.
4. Compare SFT and RLVR with at least three small-run seeds, fixed evaluation prompts, and matched inference token limits. Report task accuracy, pass@1, validity, length, generated training tokens, update tokens, wall time, and reward trajectories. If reporting pass@k, state estimator and number of samples; do not compare it directly to another model’s pass@1.
5. Build a small versioned rollout queue. Log prompt IDs, policy version, seed, generation configuration, reward-verifier version, and completion status. Introduce stale trajectories and quantify the effect of rejecting or bounding staleness.
6. Distill accepted trajectories into a student as a small optional comparison; track teacher generation cost and guard against transferring evaluation examples.

## Gate

Catch a verifier exploit, explain zero-variance group behavior, and defend an RL improvement or null result under a fixed evaluation budget. Produce [Project C](../projects/README.md).

Local arithmetic training is enough. Code-execution RL and large asynchronous infrastructure are extension topics; do not require them to complete the low-budget bootcamp.

## Dedicated lab pages

- [Lab 09-01: Arithmetic generator and verifier contract](../site/lab.html?lab=09-01) · [Markdown guide](../docs/labs/09-01.md)
- [Lab 09-02: Base, SFT, and sampling baselines](../site/lab.html?lab=09-02) · [Markdown guide](../docs/labs/09-02.md)
- [Lab 09-03: Group-relative policy updates](../site/lab.html?lab=09-03) · [Markdown guide](../docs/labs/09-03.md)
- [Lab 09-04: Controlled reasoning-RL comparison](../site/lab.html?lab=09-04) · [Markdown guide](../docs/labs/09-04.md)
- [Lab 09-05: Versioned rollout queue and staleness](../site/lab.html?lab=09-05) · [Markdown guide](../docs/labs/09-05.md)
- [Lab 09-06: Optional trajectory distillation](../site/lab.html?lab=09-06) · [Markdown guide](../docs/labs/09-06.md)
