# Compute, setup, and cost control

For the primary learner, the [existing two-PC home lab](09-home-lab.md) takes precedence over generic rental examples below. Required cloud spending is $0.

## Begin with measurement

Use Python, NumPy, PyTorch, pytest, Git, and a Linux-compatible workflow. CPU is enough for placement, gradients, tokenizers, toy transformers, bandits, and loss-function checks. CUDA/Triton labs need compatible NVIDIA hardware; other accelerators can support learning but do not demonstrate those specific skills.

Record OS, Python version, package lock or exact installed versions, accelerator model/count, VRAM, driver/runtime, RAM, and storage. Choose a mutually compatible environment using the official installation instructions. Avoid prescribing one unverified version combination for every machine. PyTorch’s [official tutorials](https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html) and [Triton tutorials](https://triton-lang.org/main/getting-started/tutorials/index.html) are implementation references; use documentation matching your installed release.

For the first CPU environment, run from the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install numpy torch pytest
python -m pip freeze > private-environment.txt
python -c 'import torch; x=torch.tensor(3., requires_grad=True); (x*x).backward(); print(torch.__version__, x.grad.item(), torch.cuda.is_available())'
```

The expected gradient is `6.0`; CUDA availability may be false. If your Python version has no compatible wheel, use a supported Python version for the selected PyTorch release. This setup recipe is for the learner to run; it does not imply dependencies were installed when the course was written. Move a reviewed, reproducible environment specification into each eventual project; keep local machine details private.

## Hardware tiers

These are proposed experiment sizes, **not fit guarantees or purchase recommendations**. Sequence length, activations, optimizer state, vocabulary, and rollout concurrency can dominate memory. Pilot before committing funds.

| Tier | Proposed work | Limits |
| --- | --- | --- |
| CPU only | 0.1–5M parameter toy models, generated text, optimizer and RL unit experiments | No GPU-kernel/performance or multi-GPU mastery claim |
| One GPU, roughly 16–24 GB VRAM | 10–100M pretraining pilots; small open-model adaptation using memory-saving methods as needed | Pilot fit and throughput; shrink context, batch, or model first |
| One larger-memory GPU | Larger pretraining sweeps or roughly 0.5–3B post-training candidates if the measured configuration fits | Full PPO may require multiple model copies; adapter fit does not imply PPO fit |
| Short access to 2–4 GPUs | DDP/FSDP correctness, scaling measurements, distributed fault diagnosis | Single-node results do not establish multi-node operation |

Default pretraining study: 10–50M parameters and 20–100M training tokens per run, starting at the small end. Increase only when the scientific question requires it. Default RL task: generated arithmetic with held-out templates and lengths. A tiny scratch policy is sufficient for algorithm mechanics; use a suitable open pretrained checkpoint for a more meaningful post-training study after reviewing its model card and resource needs.

Choose a current checkpoint at Week 19 based on license, language/task ability, context length, architecture support, and measured fit. Pin its exact revision. Do not pick the largest model you can barely load.

## A concrete budget worksheet

No current vendor price is assumed. The dollar examples below use a **hypothetical $2 per GPU-hour**, not a quote. Obtain actual rates before renting; include storage, idle time, transfer, and taxes where applicable.

| Activity | Initial GPU-hour cap, summed over all devices |
| --- | --- |
| Transformer pilots | 10 |
| Pretraining comparisons | 60 |
| Systems experiments | 20 |
| Scaling/evaluation studies | 40 |
| SFT | 20 |
| RLHF/preference work | 40 |
| Reasoning RL | 60 |
| Capstone | 100 |
| **Planned total** | **450** |
| **20% reserve** | **90** |

At the hypothetical rate, 540 GPU-hours cost $1,080 before other charges. Over roughly ten months that is $108/month on average, with uneven spending. This is a **cap for a deliberately small course**, not a promise every experiment fits. Larger multi-seed RL studies can exhaust it quickly. A zero-rental path completes conceptual labs but leaves accelerator gates pending.

For each run: `cost = devices × wall_hours × rate_per_device_hour + other_charges`. A four-GPU run lasting two hours consumes eight GPU-hours. Set a provider budget alert and job time limit; explicitly terminate idle rentals. No course command should automatically provision paid infrastructure.

## Estimate before launching

For a dense transformer, `training FLOPs ≈ 6 × N × D` is a rough accounting model, with N parameters and D tokens. It omits details such as attention at long contexts, recomputation, and some embeddings/heads; use it as a check, not an exact invoice. [Compute-optimal training paper](https://arxiv.org/abs/2203.15556).

Example: 50M parameters and 100M tokens imply roughly `3e16` FLOPs. At **hypothetical measured** effective throughput of 10 TFLOP/s, this corresponds to 3,000 seconds (~0.83 hours) of that simplified compute. Real wall time includes data loading, evaluation, saving, startup, and inefficiency; measure it rather than trusting this example.

A better operational forecast is `remaining tokens / measured end-to-end tokens per second`. Benchmark at least 100 steady-state steps after warmup; include periodic evaluation/checkpoint overhead in the final budget. Report valid-token and processed-token throughput separately when padding matters.

A common mixed-precision Adam accounting example is 2 bytes parameters + 2 gradients + 4 master weights + 8 moments = 16 bytes/parameter before activations and buffers. Actual layouts differ. Explain your configuration’s storage rather than treating 16 as universal. [ZeRO](https://arxiv.org/abs/1910.02054).

## Cheap failure detection

Before a long run: overfit a tiny batch, test masks and shifts, verify checkpoint resume, inspect samples and splits, measure memory, and run the final evaluation path once. Estimate total spend for all seeds and ablations. If over budget, reduce scale while preserving the comparison, or mark the experiment unperformed.

For distributed work, use two CPU processes to learn collectives if necessary, then perform a short real GPU run when access is available. CPU collectives do not satisfy the GPU performance gate. For code-execution rewards, begin with arithmetic validators; any later generated-code runner must use a restricted environment with resource limits and no credentials or network access.
