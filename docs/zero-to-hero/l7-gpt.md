# Lecture 7 · Attention and a decoder-only transformer

**Watch:** [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY) (Andrej Karpathy)
**Reference code:** [nanoGPT](https://github.com/karpathy/nanoGPT), MIT licensed
**Background papers:** [Attention Is All You Need](https://arxiv.org/abs/1706.03762) · [GPT-2](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
**Panel:** [one causal attention head, computed here](../../site/zero-to-hero.html?lecture=l7)
**Assessed in:** [lab 02-02](../labs/02-02.md), [lab 02-03](../labs/02-03.md), [lab 02-04](../labs/02-04.md)

## The mechanism in plain terms

Every model so far combined context positions with weights fixed by the architecture. Attention makes the weights a function of the data.

Start with the simplest useful thing: to predict position `t`, average the representations of positions `1..t`. That average is already a working "communication" mechanism, and it can be written as a matrix multiplication with a lower-triangular matrix of `1/t` entries. Attention keeps the matrix multiplication and replaces the uniform weights with learned, content-dependent ones:

1. From each position's vector, compute a **query** (what am I looking for), a **key** (what do I offer), and a **value** (what I will contribute) by three separate linear projections.
2. Score every query against every key with a dot product. A large score means this key matches this query.
3. Divide by `√head_dim`. Without it, dot products of `d` random terms grow like `√d`, the softmax saturates into a near one-hot selection at initialisation, and gradients through it nearly vanish. This is the same scale argument as lecture 4, in a new place.
4. **Mask** the upper triangle to `-inf` so position `t` cannot score against anything later, then softmax each row so weights are non-negative and sum to 1.
5. Output the weighted sum of the values.

The mask is not a detail; it is what makes next-token training legitimate. Remove it and every position sees the answer it is being trained to predict. The loss drops, the model looks excellent, and it has learned nothing that survives generation. **Assert the invariance instead of trusting the curve:** changing the final token must leave every earlier output bit-for-bit identical.

```run
const tokens = ["the", "cat", "sat", "on", "the", "mat"];
for (const causal of [true, false]) {
  const head = z2h.selfAttention({ tokens, causal });
  print(causal ? "causal " : "no mask",
        "| row sums", head.rowSums.map(s => s.toFixed(6)).join(" "),
        "| drift in earlier outputs", z2h.causalDrift({ tokens, causal }));
}
// Zero is the assertion. Any other number is the future leaking backwards.
```


The rest of the architecture exists to make depth trainable:

- **Multiple heads** run the same mechanism in parallel with smaller dimensions and concatenate; different heads can specialise. The total compute is comparable to one wide head.
- **A position-wise feed-forward block** after attention gives each position private computation. Attention moves information between positions; this block thinks about what arrived.
- **Residual connections** give gradients a path that skips every block, which is what makes 12 or 96 layers trainable at all.
- **Normalisation** (layer norm, applied before each sublayer in modern designs) keeps activation scale stable without batch coupling — the reason transformers use it instead of lecture 4's batch norm.
- **Positional information** must be added explicitly, because attention as defined is permutation-invariant: without it, a shuffled sentence produces the same set of outputs.
- **Dropout** regularises, and its train/eval distinction matters for reproducible evaluation.

Generation then reveals a cost: each new token recomputes attention over the whole prefix, so naive sampling is quadratic in length. Caching the keys and values per layer is the standard fix, and it is the first place where your implementation must agree with itself — cached and uncached generation must produce identical tokens for a fixed seed.

## Before you watch: predict in writing

1. A sequence has 6 positions. How many query–key pairs exist, and how many survive causal masking, including the diagonal?
2. Why is the scaling factor `1/√head_dim` rather than `1/head_dim`? Reason about the variance of a dot product.
3. Attention with no positional information: what is the relationship between the outputs for `the cat sat` and `sat cat the`?
4. You remove the mask by accident. Which loss changes, training or held-out, and in which direction? What would you see at generation time?
5. With 6 heads of dimension 64 and a model width of 384, how many parameters are in the attention projections of one block?

## Watch plan

| Segment | What to extract |
| --- | --- |
| Averaging as matrix multiplication | That "communication between positions" is a matmul with a triangular matrix |
| Queries, keys, values | Which projection produces which, and the shape at each step |
| Masking and softmax | Where `-inf` is written, and why before the softmax rather than after |
| Scaling by `√head_dim` | The variance argument, stated once and reused |
| Multi-head attention | How dimensions split and concatenate, and what stays constant |
| Feed-forward, residuals, normalisation | Why each is needed for depth, and where the norm goes |
| Scaling up and sampling | What changes with size, and what caching buys |

## Implement it yourself

Build it in this order, testing each stage before adding the next. Every stage should train on a small text and show a falling loss, so a regression is attributable.

1. **Bigram baseline** on your text: embedding straight to logits. Record the loss; this is your floor.
2. **One attention head**, causal, with the scaling factor. Loss must improve on the baseline.
3. **Multi-head attention** with a concatenation and an output projection.
4. **Feed-forward block** with an expansion factor of 4 and a nonlinearity.
5. **Residual connections and pre-block layer normalisation**, then stack `n` blocks.
6. **Positional embeddings**, learned, added to token embeddings.
7. **Dropout**, with an explicit train/eval switch.
8. **Generation**, first naive, then with a key/value cache.

Keep the model small enough to train on the hardware you have — see the [home-lab guide](../09-home-lab.md). A few hundred thousand parameters on a megabyte of text is enough to demonstrate everything here.

### Starting point for Colab or your own machine

The cells above run in this page, in JavaScript, because a browser can execute
them with nothing installed. The exercise itself is PyTorch, so here is the same
idea in the language you will actually write it in. Paste it into
[Colab](https://colab.research.google.com/) or a local notebook and build
outwards from it — it is a starting point, not a solution.

```python
# One causal head, and the test that makes next-token training honest.
import torch
import torch.nn.functional as F

T, C, head = 6, 32, 16
torch.manual_seed(1)
x = torch.randn(1, T, C)
key, query, value = (torch.nn.Linear(C, head, bias=False) for _ in range(3))
mask = torch.tril(torch.ones(T, T)) == 0

def forward(inputs):
    k, q, v = key(inputs), query(inputs), value(inputs)
    scores = (q @ k.transpose(-2, -1) / head ** 0.5).masked_fill(mask, float("-inf"))
    return F.softmax(scores, dim=-1) @ v

out = forward(x)
changed = x.clone()
changed[0, -1] += 1.0                              # edit only the last token
drift = (out[0, :-1] - forward(changed)[0, :-1]).abs().max().item()
print("drift in earlier outputs", drift)
assert drift == 0.0, "the mask is not doing its job"
```

## Checks that must pass

1. **Rows are distributions.** Every row of the attention weights sums to 1 within `1e-6`, with no negative entries.
2. **Causal invariance.** Change the last token of a sequence; assert every earlier position's output is **exactly** unchanged. Then remove the mask and assert this test fails. A test you have never seen fail is not evidence.
3. **Mask shape independence.** The same assertion holds at several sequence lengths, including 1 and the maximum context.
4. **Permutation sensitivity.** With positional embeddings, shuffling the input changes the outputs; without them, the multiset of outputs is unchanged. Assert both to prove positions are actually used.
5. **Parity with a reference.** Compare your attention forward pass against a framework implementation (`scaled_dot_product_attention`, or a manual reference you trust) on random inputs, to `1e-5`. Compare gradients too.
6. **Cache equivalence.** Cached and uncached generation produce identical token sequences for a fixed seed. This is the check that catches an off-by-one in the position index.
7. **Overfit a tiny text.** A few hundred characters, trained until the loss is near zero. If it cannot memorise, do not debug the hyperparameters.

## Use the panel

Open the [panel](../../site/zero-to-hero.html?lecture=l7), which computes a real attention head in your browser:

- Read the weight matrix with the mask on: the upper triangle is dark, every row sums to 1, and the drift readout is exactly zero.
- Untick **Apply the causal mask**. The drift becomes non-zero: editing the last token changed earlier outputs. That number is the leak, quantified.
- Lower the temperature toward 0.3 — equivalent to larger dot products. The weights collapse toward selecting one position. That is what happens if you forget the `1/√head_dim` scaling at a large head dimension.
- Raise it to 3 and the weights flatten toward a uniform average — attention degenerating into the simple mean you started from.

The returned matrix is drawn as a heatmap under the cell. Change the temperature and watch the rows sharpen or flatten:

```run
const head = z2h.selfAttention({ tokens: ["the", "cat", "sat", "on"], temperature: 0.4 });
head.weights.forEach((row, i) => print("query", i, row.map(w => w.toFixed(3)).join("  ")));
return head.weights;
```


## Common failures and what they look like

| Symptom | Likely cause |
| --- | --- |
| Held-out loss far better than expected, generation is incoherent | Mask missing or applied after the softmax; the model is reading the future during training |
| Loss barely improves on the bigram baseline | Residual connections missing, or the attention output is not added back to the stream |
| Training diverges at depth 6 or more | Normalisation placed after the sublayer without warmup, or no residual path |
| Attention weights nearly one-hot at step 0 | Missing `1/√head_dim` scaling |
| Generation degrades after the first few tokens with a cache | Position indices not advanced, or the cache not truncated to the context window |
| Evaluation loss varies between identical runs | Dropout still active in evaluation mode |

## Exercises

1. Implement attention twice — once with explicit loops over positions, once batched — and assert they agree. Keep the loop version as documentation.
2. Measure and plot loss against context length at fixed compute. Explain the shape of the curve you get.
3. Replace learned positional embeddings with fixed sinusoidal ones and compare. Report both losses and say what you can conclude from a single run (little).
4. Compare pre-normalisation and post-normalisation at depths 2, 4, and 8 with the same learning rate. Record which configurations fail to train.
5. Implement the key/value cache and measure tokens per second with and without it at lengths 64, 256, and 1024. Plot it and state the complexity you observe.
6. Extract the attention weights for a trained model on a sentence with a clear dependency and describe what you see — carefully. Attention weights are not explanations; say why.

## Transfer task

Without the video: write `test_no_future_leak(model)` as a reusable test that, for every position, perturbs each later position and asserts the output does not change, and returns the largest deviation found. Make it fail on a model with the mask removed, then pass on yours. This is the core deliverable of [lab 02-02](../labs/02-02.md).

## Where this goes next

Lecture 8 fills the gap this lecture leaves open: the character-level vocabulary is replaced by a learned subword vocabulary, which changes the token budget, the sequence lengths, and a surprising number of model behaviours. Lecture 9 then scales this architecture to a published configuration and prices the run.
