# Lecture 9 · Reproducing GPT-2 (124M) as a bookkeeping exercise

**Watch:** [Let's reproduce GPT-2 (124M)](https://www.youtube.com/watch?v=l8pRSuU81PU) (Andrej Karpathy)
**Reference code:** [build-nanogpt](https://github.com/karpathy/build-nanogpt) — **no license file as of September 12, 2026, so read it, do not copy it** — and [nanoGPT](https://github.com/karpathy/nanoGPT), MIT licensed
**Background papers:** [GPT-2](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) · [Scaling laws](https://arxiv.org/abs/2001.08361) · [Compute-optimal training](https://arxiv.org/abs/2203.15556)
**Panel:** [price the run before renting the GPU](../../site/zero-to-hero.html?lecture=l9)
**Assessed in:** [lab 03-05](../labs/03-05.md), [lab 03-06](../labs/03-06.md), [lab 04-01](../labs/04-01.md), [lab 05-01](../labs/05-01.md)

## The mechanism in plain terms

Reproducing a published model is not a research problem. It is an accounting problem with a deadline: get the architecture exactly right, get the data pipeline fast enough, set the schedule sensibly, measure what the hardware is actually doing, and know the cost before you start.

**Architecture exactly right.** GPT-2's published 124M configuration is 12 layers, width 768, 12 heads, a 1,024-token context, and a 50,257-token vocabulary with the input and output embeddings tied. Count the parameters yourself and confirm you reach the published figure. If your count is off by a few hundred thousand you have the wrong bias, norm, or tying convention, and every later comparison inherits the error. The panel does this count and lands on 124,439,808 parameters for that configuration — reproduce it by hand before trusting any code.

**Compute arithmetic.** A single forward-and-backward pass costs roughly `6 · N · D` floating-point operations for `N` parameters and `D` tokens: two per parameter for the forward multiply-accumulate, roughly twice that for the backward pass. Divide by what your hardware actually achieves — its peak rate multiplied by **model FLOPs utilisation**, which is measured, not assumed — and you have an estimate of wall-clock time. A rented device at 40% utilisation is doing well; treating peak as achievable overestimates progress by more than a factor of two.

**Token budget.** The compute-optimal analysis suggests roughly 20 tokens per parameter for a fixed compute budget. That guideline answers "given this much compute, how big a model" and does not answer "how good will my model be", nor does it account for inference cost, which is why production models are often trained well past it. Use it as a starting point and state which question you are asking.

**The training details that decide whether it works.** Warmup then cosine decay of the learning rate; weight decay on matrices but not on norms and biases; gradient clipping; a batch size in tokens that stays constant even when it must be assembled by gradient accumulation; mixed precision with attention to which parts stay in higher precision; and periodic evaluation on a fixed held-out split plus a checkpoint you can actually resume from.

**Throughput engineering, in the right order.** Measure first: tokens per second, memory use, and where time goes. Then fix the biggest cost. Typical wins are mixed precision, a fused attention implementation, sensible dimensions (padding a vocabulary to a multiple of 64 can help), a data loader that never starves the device, and compilation. Every one of these is a hypothesis to test with a measurement, not a ritual.

**Distributed training** multiplies throughput and adds failure modes: gradients must be averaged correctly, the effective batch size changes, the slowest worker sets the pace, and a run that crashes at hour six must resume rather than restart. [Module 4](../../modules/04-systems.md) covers this properly; this lecture shows what it feels like when it works.

**What honest evaluation looks like.** Matching a published loss on a matched split with a documented tokenizer is a reproduction. A loss number from a different tokenizer, a different split, or a different evaluation harness is not comparable and should not be presented as one. Read the [experiment standards](../07-experiments.md) before writing your report.

## Before you watch: predict in writing

1. Compute the parameter count of the 124M configuration from the shapes. Show the arithmetic for embeddings, attention, feed-forward, and norms, then compare with the published figure.
2. At `6 · N · D`, how many FLOPs is 10B tokens for that model? How long is that on one device at 400 TFLOP/s dense and 40% utilisation?
3. Your device has 24 GB. Estimate the memory for parameters, gradients, and Adam state in single precision. Where does activation memory come in, and what reduces it?
4. You double the batch size and keep the learning rate. What happens to the loss curve per step, and per token?

## Watch plan

This lecture is long. Treat it as four sessions and stop at each boundary to write down what you would do differently on your hardware.

| Session | What to extract |
| --- | --- |
| Architecture and weight loading | Exact shapes, tying, initialisation, and how a published checkpoint is verified |
| Speed work | The sequence of optimisations and the measurement that justified each |
| Hyperparameters and data | Schedule, clipping, decay, accumulation, and the shard format for streaming |
| Scaling out and evaluating | Multi-device correctness, resumption, and what is compared against what |

## Implement it yourself, at your budget

A full reproduction needs rented hardware. Do the version your machine supports — the skills transfer, the numbers do not.

**Tier 0, no cloud spend (everyone starts here).** Build the accounting: a parameter counter, a compute and cost estimator, a memory estimator, a throughput measurement, and a scaled-down configuration (for example 6 layers, width 384, context 256) trained on a small corpus for a fixed token budget. Report measured tokens per second and utilisation for your device, then extrapolate to the 124M configuration and state your assumptions.

**Tier 1, one small GPU.** Train the scaled-down model to a documented held-out loss with checkpointing and resumption. Add mixed precision and a fused attention path, measuring before and after. Show that a resumed run continues the loss curve rather than restarting it.

**Tier 2, rented multi-GPU.** Attempt the published configuration on a documented token budget with a pre-committed spend limit. Before launching: a written plan, a cost estimate, a checkpoint policy, and a stopping rule. Log everything; an unlogged run that produced a good number is not a result.

Whatever tier you are in, the deliverable is a report with a pre-registered plan, measured numbers, and an explicit gap between estimate and reality.

## Checks that must pass

1. **Parameter count matches the target configuration exactly.** Assert the total; do not print and squint.
2. **Loading a published checkpoint reproduces its reported behaviour.** If you load GPT-2 weights, the loss on a fixed text must be in the published range, and generation must be coherent. This is the cheapest possible test of architectural correctness.
3. **Throughput is measured, not assumed.** Report tokens per second and derived utilisation for at least three configurations, with the measurement method stated.
4. **Accumulation equivalence.** A batch of 64 in one step and 8 accumulation steps of 8 produce the same gradient to floating-point tolerance. Assert it — the loss-scaling error here is easy and silent.
5. **Resumption equivalence.** Kill a run at step `k`, resume from the checkpoint, and confirm the loss curve continues rather than jumping. Optimizer state and data-loader position must both be restored.
6. **Distributed gradient equivalence**, if you run multi-device: gradients averaged across workers match a single-device run at the same effective batch, to tolerance.
7. **Evaluation is fixed.** The held-out split, tokenizer, and metric are pinned and documented before the first run. Changing any of them mid-study invalidates the comparison.

## Use the panel

Open the [panel](../../site/zero-to-hero.html?lecture=l9):

- Leave the defaults at 12 layers and width 768 and check the parameter total against the published 124M figure. Then look at the component table: the embedding and output projection are a large share at this size and a small share at 10× the width — a fact that drives architecture choices.
- Set tokens to 10B and devices to 8 at 400 TFLOP/s and 40% utilisation. Read the hours and dollars. Then drop utilisation to 15%, the sort of number an untuned pipeline produces, and read the cost again. That difference is what the speed work in this lecture is worth.
- Compare your token count against the 20-tokens-per-parameter line. Decide, in writing, whether you are training a compute-optimal model or a deliberately over-trained one.
- Look at the schedule curve: warmup, then cosine decay to a floor. Note that the final learning rate is not zero, and say why that choice is defensible.

Everything in this panel is planning arithmetic. It cannot tell you your throughput; only your own measurement can.

## Common failures and what they look like

| Symptom | Likely cause |
| --- | --- |
| Parameter count slightly off | Bias or norm convention, or embeddings counted twice when tied |
| Loaded checkpoint produces nonsense | Weight transposition or a permuted head layout |
| Throughput far below expectation | Input pipeline starving the device; profile before changing the model |
| Loss spikes early then recovers slowly | Warmup too short or clipping absent |
| Loss diverges only at a larger batch size | Learning rate not adjusted for the change in effective batch |
| Multi-device run is slower than one device | Communication cost or a straggler; measure both before concluding |
| Resumed run restarts the loss curve | Optimizer state or data position not checkpointed |
| Your loss beats the published number | Almost always an evaluation mismatch. Check the tokenizer and the split before celebrating |

## Exercises

1. Derive the parameter count formula for a GPT-2 style decoder, then verify it at three widths against your implementation.
2. Build a memory estimator covering parameters, gradients, optimizer state, and activations, and compare it with measured peak memory. Report the discrepancy and explain it.
3. Measure tokens per second at batch sizes 1 to the largest that fits, plot it, and identify where the device stops being the bottleneck.
4. Estimate the cost of the published run at three utilisation figures and three device prices. Present it as a table a manager could read.
5. Run the same short training twice with the same seed and once with a different seed. Report the spread; that spread is the smallest difference a later claim can credibly resolve.
6. Write the pre-registration for your own tier's run before executing it: question, budget, metric, split, stopping rule. Keep it unchanged and note every deviation afterwards.

## Transfer task

Without the video: write `plan_run(config, tokens, device_profile)` returning parameter count, estimated FLOPs, estimated hours, estimated dollars, estimated peak memory, and the token-per-parameter ratio, with every assumption named in the output. Then run a real short training, measure the same quantities, and write a one-page comparison of plan versus reality with the largest error explained. That page is the deliverable for [lab 04-01](../labs/04-01.md) and the habit [module 5](../../modules/05-scaling-evaluation.md) is built on.

## Where this goes next

This is the end of the series and the start of the parts of the course it does not cover: corpus curation and provenance ([module 3](../../modules/03-pretraining.md)), systems and distribution ([module 4](../../modules/04-systems.md)), scaling and evaluation ([module 5](../../modules/05-scaling-evaluation.md)), and everything after pretraining ([modules 6 to 10](../02-curriculum.md)). You now have a transformer you can build and debug. Frontier-scale operating experience is a different thing, and you earn it on a different budget.
