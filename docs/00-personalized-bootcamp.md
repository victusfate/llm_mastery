# Your 24-week hands-on bootcamp

## Starting point and objective

This route is tailored to an experienced software engineer with substantial C++, simulation, modeling, algorithm development, backend, and startup experience; practical linear algebra and classical ML; and conceptual familiarity with deep learning. The stated gaps are data curation/aggregation, pretraining, large distributed training, RL, and alignment.

The immediate goal is **hands-on deep-learning training expertise**: you can implement a training system, diagnose failures, design fair experiments, and explain its mathematical and systems behavior. Frontier-lab recruiting is a possible later application of that expertise. This course does not equate an intensive bootcamp with an established frontier research record.

The supplied public résumé adds formal physics/electrical-engineering study, scientific publications, GPU graphics/compute work, and deployed real-time/batch ML systems. It also supports broad language fluency including Python and C++; the learner additionally reports JS, TS, Ruby, and other languages. These credentials strengthen the case for an implementation-focused route but do not waive fresh training/RL gates. The public résumé was read on September 8, 2026; contact details are intentionally not reproduced. [Background source](https://victusfate.github.io/resume/).

These background descriptions are self-reported, not assessed. The first two weeks establish PyTorch/autograd and transformer implementation fluency. General software engineering is not retaught. Keep personal employment history outside the public materials; this route describes a reusable experienced-engineer profile.

## Minimum and recommended duration

**Use 24 study weeks (~5.5 months, 1,248 coursework hours) as the working plan, plus four reserve weeks.** That is roughly six to seven calendar months with interruptions. This is an author estimate based on the assignments and assumed transferable skills, not an empirical guarantee.

An **18–20 week route (936–1,040 hours)** is a plausible lower planning bound for the hands-on objective only if the first two weeks demonstrate strong independent implementation, hardware access is sufficient, and several later gates are already familiar. Do not select it just because the calendar is attractive. If PyTorch and optimization fundamentals prove less fluent, move to the 40-week route or add targeted weeks.

Do not infer a minimum timeline to exceptional compensation from either route. Add an optional 8–16 week research/collaboration extension after the bootcamp; external recognition and offers remain uncertain.

## Weekly plan

All weeks use the [52-hour schedule](01-timeline.md). The longer module guides contain the exercise specifications; this table **overrides their nominal week numbers and allocations for this route**. Core correctness and evaluation gates remain required. Stretch exercises may move to the extension. Each week should end with a runnable artifact and a short report, not just notes.

| Week | Focus and module | Required output |
| --- | --- | --- |
| 1 | [Foundations](../modules/01-foundations.md): placement, tensor/autograd fluency, training dynamics | NumPy gradient check; PyTorch MLP and small convolutional classifier; overfit/random-label controls; optimizer comparison |
| 2 | [Transformer](../modules/02-transformer.md): tokenizer, causal decoder, optimizer | Tiny LM from tensor operations; reference parity, causal mask, shifted-target and resume checks |
| 3 | [Pretraining](../modules/03-pretraining.md): data sourcing and aggregation | Two-source manifest, streaming ingestion, document split, corruption handling, distribution audit |
| 4 | Data curation and contamination | Exact/near-duplicate audit, filter ablation, held-out contamination probes |
| 5 | Pretraining end to end | Controlled baseline/curation comparison, recovery test, loss/sample report; Project A first release |
| 6 | [Systems](../modules/04-systems.md): GPU execution and profiling | Shape/memory/FLOP model, profiler trace, bottleneck hypothesis |
| 7 | Kernel and training-loop optimization | Correct custom kernel; steady-state and end-to-end benchmark; regression cases |
| 8 | DDP and sharding | Actual two-GPU gradient equivalence and DDP/FSDP comparison, or explicitly pending hardware gate |
| 9 | Distributed reliability and scale design | Fault/restart test, straggler diagnosis, multi-node design review; Project B release |
| 10 | [Scaling/evaluation](../modules/05-scaling-evaluation.md): compute allocation | Small iso-compute comparison, uncertainty and extrapolation limitations |
| 11 | Reliable evaluation | Leakage audit, paired task evaluation, confidence interval, error analysis; Project A revision |
| 12 | [SFT](../modules/06-sft.md): adaptation and instruction data | Assistant-only loss masking, full/adapter comparison on a small model |
| 13 | SFT data and behavior | Data-quality ablation, pre/post capability and behavior checks, frozen reference policy |
| 14 | [RL](../modules/07-rl.md): policy gradients | Exact bandit objective/gradient comparison and REINFORCE implementation |
| 15 | Actor-critic, GAE, PPO | Tiny-environment PPO, terminal/truncation checks, value/entropy/KL diagnostics |
| 16 | [RLHF/preferences](../modules/08-alignment.md): reward modeling | Preference data audit, reward model, held-out pair accuracy and bias analysis |
| 17 | DPO | Independent objective implementation, reference parity, beta/noisy-label study |
| 18 | PPO-based RLHF and alignment evaluation | Minimal text PPO, reward-hacking experiment, SFT/DPO/PPO comparison |
| 19 | [Reasoning RL](../modules/09-reasoning-rl.md): RLVR and group advantages | Arithmetic task generator, deterministic verifier, group-relative training loop |
| 20 | Reasoning experiments | SFT versus RL comparison, multiple seeds, token-budget and pass@1 controls |
| 21 | Rollout systems and failure analysis | Versioned rollouts, stale-policy test, batched generation; Project C release |
| 22 | [Capstone](../modules/10-research.md): choose one bounded question | Prior-work comparison and frozen experimental plan; baseline already inherited from A/B/C |
| 23 | Capstone execution | Controlled ablations, repeated result or documented null finding; external review requested |
| 24 | Capstone defense and handoff | Clean reproduction, 20-minute defense, skill-gap inventory and next learning plan |

This compresses the full route by relying on existing engineering skills and reusing one training stack. Week 2 is particularly demanding: if you cannot pass its gate, add transformer weeks rather than carrying implementation uncertainty into pretraining.

## What we will prioritize

Approximately half the time should be spent implementing and debugging. Use your simulations background to demand invariants, small reference models, numerical checks, and controlled experiments. Use backend experience for data pipelines and asynchronous rollout infrastructure; explicitly learn the parts that differ, including gradient synchronization and stochastic optimization.

Mandatory breadth includes MLPs, a small convolutional model, transformers, optimization, data, evaluation, supervised adaptation, RL, and alignment. The main depth is language-model training. Vision foundation models, diffusion, audio, and multimodal training are optional later branches, not silently included in a claim of expertise in every deep-learning family.

Read only the sections that unblock the week’s experiment. Build a small reference implementation before relying on framework trainers. Once the mechanism is understood and checked, use established tools for larger experiments rather than spending the course rebuilding infrastructure.

## First session with me

Complete the placement tasks on tensor gradients, causal modeling, and experiment diagnosis. We will review the attempt and choose the right amount of Week 1 remediation. The diagnostic is not a test of how many terms you recognize.

The [home lab](09-home-lab.md) uses a 5090 PC, a 5080 PC, and a recent MacBook Pro, with $0 required cloud spend. Exact OS, RAM, and networking remain to be inventoried. Start the [open-source lane](08-open-source.md) in Week 1, allocating six hours within the existing weekly budget. Aim for a useful local reproduction in the first week and a reviewable contribution within two weeks; maintainer acceptance has no fixed deadline.

## Learning interface and agent use

Use the [interactive workbench](10-interactive.md) for short lessons, manipulable examples, randomized theory checks, and scheduled review. Use the tutor for live explanation and assessment of actual code. Agent-assisted engineering is a normal work mode; independent small transfer tests establish what the learner personally understands.
