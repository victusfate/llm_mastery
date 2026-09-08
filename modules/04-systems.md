# Module 4: GPU and distributed training systems

Full route: Weeks 11–14, 208 hours. Bootcamp: Weeks 6–9, 208 hours. Dependency: a correct pretraining loop.

## Outcome

You can identify the limiting resource, implement a verified optimization, and reason about gradient synchronization, sharding, and recovery using measurements.

## Concepts to explain

Distinguish compute throughput, memory bandwidth, launch overhead, data loading, and network communication. Peak specifications do not predict achieved training speed. Warmup, asynchronous execution, compilation, synchronization, and input shapes affect benchmarks.

DDP replicates the model and synchronizes gradients; it does not combine VRAM into a larger transparent device. Sharding distributes model state but adds communication. Learn all-reduce, reduce-scatter, all-gather, gradient bucketing, overlap, accumulation, activation checkpointing, tensor/pipeline/context parallelism, pipeline bubbles, and topology. Explain MoE routing, load balance, and all-to-all traffic in a design exercise; large MoE training is a stretch.

References: [FlashAttention](https://arxiv.org/abs/2205.14135), [ZeRO](https://arxiv.org/abs/1910.02054), [PyTorch FSDP2 tutorial](https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html), [Triton tutorials](https://triton-lang.org/main/getting-started/tutorials/index.html), and [Megatron-LM](https://github.com/NVIDIA/Megatron-LM).

## Labs

1. Produce a parameter/optimizer/activation memory ledger and approximate FLOP budget for your decoder. Profile a fixed run and explain the top three costs. Compare short and longer contexts.
2. Optimize one demonstrated bottleneck: data prefetch, batching, fused operations, or compilation. Preserve tokens, precision policy, and loss behavior. Report both microbenchmark and end-to-end results.
3. Implement a small Triton softmax or normalization kernel. Compare against a reference across shapes, nontrivial edge cases, and dtypes; document supported layouts. Include backward parity if the kernel participates in training. A forward-only kernel must be labeled inference/forward-only evidence. Study tiled attention and online softmax; implementing full attention backward is optional.
4. Run a toy DDP model with one GPU per process. Match a single-process effective batch, disable stochastic layers for equivalence, and compare gradients and one optimizer update. For unequal valid-token counts, aggregate a global token-weighted objective rather than averaging local means incorrectly.
5. Compare DDP and FSDP memory/step time at matched work, and checkpoint/restore. On the home two-PC setup, this is a real two-node experiment with consumer networking; log link speed and rank asymmetry. Distinguish it from a high-bandwidth datacenter cluster.
6. Inject a slow rank and a failed worker. Demonstrate timeout/error reporting and a deliberate relaunch from a consistent checkpoint. Automatic elastic recovery is a stretch; never claim it if you manually restarted.

Produce [Project B](../projects/README.md), including an 8/64/512-GPU design exercise with bandwidth assumptions, failure domains, and unanswered questions. The exercise is a model, not measured experience.

## Gate

Show actual accelerator profiling, kernel correctness, distributed gradient parity, and a recovery trace. Explain why the local two-GPU configuration may be slower than the 5090 alone. A measured slowdown can pass when diagnosed rigorously. If GPUs or network access are unavailable, keep hardware gates pending and complete CPU reference tests first.

## Dedicated lab pages

- [Lab 04-01: Memory accounting and profiler baseline](../site/lab.html?lab=04-01) · [Markdown guide](../docs/labs/04-01.md)
- [Lab 04-02: Optimize one measured training bottleneck](../site/lab.html?lab=04-02) · [Markdown guide](../docs/labs/04-02.md)
- [Lab 04-03: A verified GPU kernel](../site/lab.html?lab=04-03) · [Markdown guide](../docs/labs/04-03.md)
- [Lab 04-04: Distributed gradient equivalence](../site/lab.html?lab=04-04) · [Markdown guide](../docs/labs/04-04.md)
- [Lab 04-05: DDP versus FSDP across two nodes](../site/lab.html?lab=04-05) · [Markdown guide](../docs/labs/04-05.md)
- [Lab 04-06: Straggler and worker-failure investigation](../site/lab.html?lab=04-06) · [Markdown guide](../docs/labs/04-06.md)
