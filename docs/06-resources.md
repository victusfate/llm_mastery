# Reading and media library

Primary references checked September 8, 2026. Read only the sections needed for the current lab. Pin paper/repository versions in experiment reports because live documentation and revised papers change. This is a curated sequence, not a requirement to read every resource cover to cover.

| Module | Required selection | What to extract |
| --- | --- | --- |
| Foundations | [Dive into Deep Learning](https://d2l.ai/) preliminaries, MLPs, optimization | Gradients, training controls, numerical habits |
| Transformer | [Attention Is All You Need](https://arxiv.org/abs/1706.03762); [Stanford CS336](https://cs336.stanford.edu/) architecture/tokenization material | Tensor shapes and architecture decisions |
| Pretraining | [TinyStories](https://arxiv.org/abs/2305.07759); [DataTrove](https://github.com/huggingface/datatrove) | A small modeling setting and inspectable data processing |
| Systems | [FlashAttention](https://arxiv.org/abs/2205.14135); [ZeRO](https://arxiv.org/abs/1910.02054) | IO-aware computation and state sharding |
| Systems implementation | [Triton tutorials](https://triton-lang.org/main/getting-started/tutorials/index.html); [FSDP2 tutorial](https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html) | Small kernels and distributed semantics |
| Scaling | [Training Compute-Optimal LLMs](https://arxiv.org/abs/2203.15556) | Allocation assumptions and empirical fits |
| Evaluation | [LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness) | Task specifications, metrics, reproducibility |
| SFT | [LoRA](https://arxiv.org/abs/2106.09685); [TRL docs](https://huggingface.co/docs/trl/index) | Adaptation objective and implementation inspection |
| RL | [Policy-gradient derivation](https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html); [PPO](https://arxiv.org/abs/1707.06347) | Estimators, baselines, clipping |
| RLHF | [InstructGPT](https://arxiv.org/abs/2203.02155); [DPO](https://arxiv.org/abs/2305.18290) | Policy roles and preference objectives |
| Reasoning RL | [DeepSeekMath](https://arxiv.org/abs/2402.03300); [DeepSeek-R1](https://arxiv.org/abs/2501.12948) | Group-relative optimization and reasoning experiments |
| Larger codebases | [OLMo-core](https://github.com/allenai/OLMo-core); [Megatron-LM](https://github.com/NVIDIA/Megatron-LM); [verl](https://github.com/verl-project/verl) | Read one execution path end to end |

## Video use

Use [Stanford’s recorded CS336 tokenization lecture](https://www.youtube.com/watch?v=SQ3fZ1sAqXI) and [architectures lecture](https://www.youtube.com/watch?v=ptFiH_bHnJw), with the [2025 archive](https://cs336.stanford.edu/spring2025/index.html) for associated materials. The [current course page](https://cs336.stanford.edu/) provides the newer offering. Do not assume old assignment requirements or APIs match current versions.

For building the machinery yourself, use the [Zero to Hero companion track](18-zero-to-hero.md): nine linked lectures by Andrej Karpathy, paired with our study plans, interactive panels, and checks. Videos and notebooks are his and are linked, never reproduced; [licensing notes](zero-to-hero/licensing.md) record the status of each work.

Watch 10–20 minutes at a time. Stop, state the mechanism from memory, predict a concrete result, then implement or calculate it. Playback speed is a preference; shorten the segment if recall fails. The interactive workbench links these lectures and lets you open a video intentionally; external video playback needs network access and may be blocked by the provider.

## Paper review questions

What is the claim? What was actually measured? Which assumptions make the derivation work? What is the strongest baseline? What is the cheapest falsifying experiment? What changes at your scale? Save a one-page review using the template, then perform a small check.

## Scope

Required reading covers language-model training and broad practical foundations. Optional later branches include multimodal models, diffusion, speech, interpretability, and deeper optimization theory. Add a branch only after choosing a concrete project and reviewing current primary sources.
