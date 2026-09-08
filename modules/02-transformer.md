# Module 2: implement a language model

Full route: Weeks 3–6, 208 hours. Bootcamp: Week 2, 52 hours with strong implementation prerequisites. Dependency: Module 1.

## Outcome

A tiny decoder-only LM built using basic tensor operations and autograd, with your own tokenizer, attention, normalization, loss, optimizer, and training loop. Use library reference implementations to check results after the first attempt.

## Concepts to explain

Causal modeling factors a sequence probability as `product_t p(x_t | x_<t)`. Attention uses `softmax(Q K^T / sqrt(d_head) + causal_mask) V`. With B batch, H heads, T sequence length, and d head width, Q/K/V are B×H×T×d, and scores are B×H×T×T.

Learn byte-level tokenization and BPE, embeddings, residuals, LayerNorm/RMSNorm, positional information including RoPE, gated feed-forward layers, multi-head versus grouped-query attention, tied embeddings, sampling temperature, and KV caching. Build a minimal correct architecture first; add one modern component at a time. The original [Transformer paper](https://arxiv.org/abs/1706.03762) is the attention reference; [CS336](https://cs336.stanford.edu/) provides modern language-model context.

## Labs

1. Start with a byte tokenizer. Implement small-corpus BPE, deterministic tie-breaking, special tokens, and encode/decode round trips including Unicode. Train tokenizer statistics on training documents only.
2. Implement a two-layer decoder with explicit shape assertions. Check causal invariance by modifying a future token; compare attention forward/backward with a trusted reference in float32.
3. Implement AdamW, clipping, accumulation, evaluation, logging, and checkpoint/resume. Test optimizer updates on a tiny fixed tensor against a reference. Check next-token label shifting, padding, and loss denominators with a hand-computable sequence.
4. Overfit a small batch, then train a 1–10M parameter pilot on generated text or a reviewed small corpus. Record token counts, held-out loss, and fixed-prompt samples across checkpoints. Implement generation with and without a KV cache and compare logits with dropout off.

For the one-week bootcamp version, use a small vocabulary and model; preserve correctness checks and defer extended architecture ablations. CPU smoke tests should finish quickly enough for interactive debugging; choose counts accordingly rather than promising a hardware-independent runtime.

## Gate

Rebuild a tiny causal block on a fresh specification, explain target alignment and each tensor shape, demonstrate stable loss and resumability, and debug a mask or optimizer-state error. Generating plausible text alone does not pass.

Stretch: implement both RMSNorm/RoPE and grouped-query attention; compare memory and arithmetic accounting. Do not train a large model before the pilot is correct.
