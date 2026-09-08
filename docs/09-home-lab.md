# Your home lab

Start with the hardware you already have. The course does not require a particular GPU, two PCs, or cloud spending. In the interactive reader, use **Your setup** to choose your resources and get a starting plan. Your choices stay in this browser and can be changed or cleared at any time.

## Choose a starting path

| Available hardware | Begin with | Scale up when |
| --- | --- | --- |
| Browser only | Definitions, visual experiments, theory checks, readings and tutor discussions | You have access to a Python environment for implementation labs |
| Laptop or desktop CPU | NumPy examples, gradients, tiny models, data checks and evaluation fixtures | A measured experiment requires more compute |
| Apple Silicon Mac | CPU correctness checks, then supported accelerated operations | Your selected framework and operations pass a forward/backward test |
| One GPU | Tiny training loops, memory measurements, then progressively larger experiments | A smaller run has answered the correctness questions |
| Multiple GPUs | Independent seeds and ablations first; distributed correctness experiments later | You have measured interconnect and communication costs |

Model size alone cannot predict whether training fits. Activations, sequence length, optimizer state, batch size, numerical precision, and additional policy/reference/value models all matter. Start with a small run and measure peak memory before increasing any dimension.

## Record your own inventory

Record operating system, CPU, system memory, free disk, accelerator model, usable accelerator memory, and the framework version. For multiple machines, also measure a file transfer and record network throughput. Keep hostnames, IP addresses, and account details out of public learning logs.

Use the [official PyTorch installer](https://pytorch.org/get-started/locally/) for the current supported combination. Check the relevant backend documentation before installing optional kernels: [CUDA](https://docs.pytorch.org/docs/stable/notes/cuda.html) or [Apple MPS](https://docs.pytorch.org/docs/stable/notes/mps.html). Successful inference does not establish that backward passes or all optional extensions work.

## Start with a correctness experiment

1. Run a small tensor computation and its backward pass.
2. Compare a gradient with a finite-difference estimate.
3. Overfit a tiny batch and explain why that is a debugging check, not generalization.
4. Record wall time and peak memory for the actual training configuration.
5. Increase one dimension at a time, retaining a configuration that fits comfortably.

Use the [foundations walkthrough](../modules/01-foundations.md) and the [general compute guide](04-compute.md). The course's larger runs are extensions; basic algorithmic understanding can be developed with deliberately small examples.

## Multiple devices are separate resources

Memory on separate GPUs does not automatically become one larger device. With data-parallel replicas, each worker needs space for its own model state. Sharding changes memory and communication requirements; it does not remove the need to measure them.

Independent jobs are often useful before synchronized training. Compare one device with multiple devices at controlled effective batch size, and separate algorithmic effects from hardware effects. A slow distributed run can still teach you how to profile communication.

## Set your own spending ceiling

A zero-cloud-budget path is supported. Optional cloud access is not a requirement or an instruction to spend. Before renting hardware, write the experiment question, estimated run duration, hourly quote, storage charges, stopping condition, and total spending ceiling. Record actual costs afterward.

Local electricity and storage also cost money. Estimate electricity from measured average system power, runtime, and your local rate. A declared budget is a planning limit, not an expected bill.

## Worked example: a multi-machine setup

The [RTX 5090 + RTX 5080 + MacBook Pro example](09-home-lab-example.md) illustrates one contributor's configuration. It is an optional case study, not the assumed hardware of the reader.
