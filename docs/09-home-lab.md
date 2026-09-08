# Home lab: RTX 5090, RTX 5080, and MacBook Pro

## Use the hardware you own

The desktop RTX 5090 specification lists **32 GB VRAM** and the RTX 5080 lists **16 GB**. Both list no NVLink support. Verify the actual installed cards, driver, and usable memory locally. [NVIDIA 5090 specifications](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/), [NVIDIA 5080 specifications](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/).

| Machine | Primary role |
| --- | --- |
| 5090 PC | Main pretraining/adaptation runs, larger memory experiments, kernel work |
| 5080 PC | Independent seeds/ablations, smaller training jobs, evaluation or rollout generation |
| Recent MacBook Pro | Interactive lessons, coding, data inspection, CPU tests, SSH orchestration; optional Apple-accelerated experiments after identifying the chip |

Default to independent jobs on the two PCs. That avoids synchronizing every step across a home network. The 16+32 GB capacities are **not a single 48 GB device**. For DDP, both workers hold a replica; the smaller card and slower worker constrain a symmetric setup. FSDP introduces other memory/communication tradeoffs and should be measured separately.

## First hardware inventory

On each PC, record OS, `nvidia-smi` output, supported Python/PyTorch/CUDA combination, CPU RAM, free disk, wired network interface speed, and a timed file transfer. Keep IP addresses and machine names private. Neither the network nor installed software has been inspected from this repository session.

Both GPUs are Blackwell-generation devices. Select a driver and PyTorch CUDA build that supports the actual device using the [official installer](https://pytorch.org/get-started/locally/); test a forward/backward operation before installing optional kernels. Then independently test Triton/attention-library support. A working PyTorch matmul does not establish every extension’s compatibility.

Use a reproducible Linux environment on the PCs for CUDA/distributed labs. If using Windows/WSL, check support for the particular distributed backend and networking configuration; do not assume a Linux distributed recipe transfers unchanged. Exact OS/RAM/network details remain to be inventoried.

## Suggested starting sizes

- Scratch pretraining: 10–50M parameters, context 256–512, microbatch selected by measurement; then pilot 100M if useful.
- Post-training: first tiny scratch policies for objective correctness, then an open 0.5–1.5B candidate for short-response experiments if the actual optimizer/reference/rollout configuration fits.
- Multiple concurrent policy/reference/value/reward copies can exceed memory well before one model’s weights do. Begin with sequential or shared/frozen components only where the algorithm and implementation support them; adapters change memory, not the need to account for every component.
- Run independent ablations on both PCs, labeling hardware differences. For training comparisons, control token/step budgets; for performance comparisons, use the same hardware or clearly separate the hardware effect.

These are starting proposals, not performance or fit claims. Benchmark with real sequence lengths and checkpoint/evaluation overhead.

## Two-node distributed lab

Use one GPU on each PC, connected on a trusted local network. The PCs form two nodes, so this is real small multi-node experience. Start with a tiny model and deterministic batch. Check rendezvous/backend connectivity, gradient equivalence, timeouts, and rank-specific logs before throughput runs. Use a private interface and do not expose the training rendezvous port publicly.

For communication intuition: 100M parameters with a hypothetical 2-byte gradient tensor require 200 MB of gradient payload. Merely moving 200 MB across an ideal 1 Gbit/s link takes 1.6 seconds before protocol/collective overhead; at 10 Gbit/s the payload bound is 0.16 seconds. Actual collectives, dtype, overlap, and topology change total cost. Measure link throughput and collective time; do not assume either network speed is installed.

Compare the 5090 alone, the 5080 alone, and both nodes at controlled effective batch. A slower two-node run is an excellent profiling lesson. For homogeneous high-bandwidth scaling, a short hosted run is optional—not required to pretend the home topology is equivalent.

## Low-budget policy

The primary bootcamp uses existing machines and targets **$0 required cloud spend**. Local electricity/storage are still costs. Estimate electricity as measured average system kW × hours × your local electricity rate. Do not use marketing peak power as a measured bill.

Treat the GPU-hour worksheet in the [general compute guide](04-compute.md) as a work cap; its hypothetical rental cost is not your expected local spend. A proposed optional external envelope is **$0–$100/month, with no spend assumed until you choose a ceiling**. No paid resources are provisioned by the course. Schedule useful work on the other machine while a run is active; unattended run time is not extra study credit.
