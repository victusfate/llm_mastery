# Lecture 5 · Backpropagation at tensor level, by hand

**Watch:** [Building makemore Part 4: Becoming a Backprop Ninja](https://www.youtube.com/watch?v=q8SA3rM6ckI) (Andrej Karpathy)
**Reference material:** the [lecture notebooks](https://github.com/karpathy/nn-zero-to-hero) (MIT licensed) and the exercise notebook linked from that repository
**Panel:** [break one backward rule and watch the check catch it](../../site/zero-to-hero.html?lecture=l5)
**Assessed in:** [lab 01-01](../labs/01-01.md) and [lab 04-03](../labs/04-03.md)

## The mechanism in plain terms

Lecture 1 differentiated scalars. Real networks differentiate tensors, and the difference is not conceptual but bookkeeping: every backward rule must produce a gradient with **exactly** the shape of the thing it differentiates, which means sums over the axes that were broadcast and transposes in the right places.

Four rules cover most of a network. Take a batch of `B` examples throughout.

**Linear layer.** For `Y = X W + b` with `X` of shape `B × n` and `W` of shape `n × m`:
- `dX = dY Wᵀ` — shape `B × n`, because each input row contributed to one output row through all of `W`
- `dW = Xᵀ dY` — shape `n × m`, summing over the batch, because every example used the same weights
- `db = sum of dY over the batch axis` — shape `m`

The transposes are not arbitrary. They are forced: there is exactly one way to contract the indices that yields the required shape. When you are unsure, write the shapes and let them dictate the expression.

**Elementwise nonlinearity.** For `H = tanh(Z)`, `dZ = dH * (1 - H²)`, elementwise, same shape. Reusing the *output* `H` rather than recomputing from `Z` is both cheaper and how libraries do it.

**Softmax with cross-entropy.** For mean loss over a batch, the gradient with respect to the logits is `(P - Y) / B`, where `P` is the softmax output and `Y` the one-hot targets. This is the single most valuable derivative in machine learning: the cancellation that makes it this simple is why the pair is always fused. Two parts are easy to get wrong and hard to notice — the `1/B` when the loss is a mean, and the subtraction of the one-hot target, without which every class is pushed down and none up.

**Embedding lookup.** Forward is indexing; backward is a scatter-add into the table. Each row accumulates the gradients of every position that used it, so repeated indices must add rather than overwrite — the tensor-level version of lecture 1's fan-out bug.

**Normalisation.** The batch-normalisation backward pass is the hard one, because the mean and variance depend on every example, so each example's gradient has three terms: the direct path, the path through the mean, and the path through the variance. Deriving it once, on paper, is the point of the exercise. A compact form exists and is satisfying to reach.

Why do this at all, when autograd exists? Because you cannot debug what you cannot predict. Fused kernels, mixed precision, gradient clipping, checkpointing, and custom operators all require knowing what the backward pass should produce. In [module 4](../../modules/04-systems.md) you will write a kernel and supply its gradient, and a finite-difference check will be the only thing standing between you and a silently wrong training run.

## Before you watch: predict in writing

1. `X` is `32 × 100`, `W` is `100 × 50`. What are the shapes of `dX`, `dW`, and `db`? Which one involves a sum over the batch?
2. For a mean cross-entropy loss, what is the gradient with respect to the logit of the **correct** class, in terms of its probability? Is it positive or negative, and what does descent therefore do to that logit?
3. An index appears twice in one batch of an embedding lookup. How many contributions does that row of the table receive?
4. You forget the `1/B` factor. Does the loss still fall? What does that imply about using the loss curve as a correctness check?

## Watch plan

This lecture is an exercise, not a talk. Work the exercise notebook yourself and use the video to unblock a specific derivation rather than to watch the answers in order.

| Segment | What to extract |
| --- | --- |
| The setup and the comparison harness | How each hand-derived gradient is compared against the framework's, elementwise |
| Cross-entropy backward | Where the cancellation happens, and where the `1/B` enters |
| Linear layer backward | The shape argument for each transpose |
| `tanh` backward | Why the output is reused instead of the input |
| Batch-norm backward | The three paths, and the simplification at the end |
| Embedding backward | Scatter-add, and why `+=` matters again |

## Implement it yourself

**Harness first.** Write the comparison before any derivation: a function taking your gradient and the framework's, reporting maximum absolute difference, maximum relative difference, and whether shapes match. Shape mismatch is a failure, not a warning.

**Then derive and implement, one at a time**, checking each before moving on:
1. cross-entropy with respect to logits
2. the output linear layer (`W2`, `b2`, and the hidden activations)
3. `tanh`
4. batch normalisation (scale, shift, and input)
5. the first linear layer
6. the embedding lookup

**Finally, remove the framework.** Train the model for 200 steps using only your gradients and confirm the loss matches an autograd run to a few decimal places over the same seed and batch order.

## Checks that must pass

1. **Every tensor, elementwise.** Maximum absolute difference below `1e-8` in double precision, or roughly `1e-4` relative in single precision. State which precision you used; the tolerance is meaningless without it.
2. **Shapes asserted.** A test that fails when a gradient has the right values in the wrong shape. Broadcasting will otherwise hide the error until a batch size changes.
3. **Independent finite differences.** Check at least one tensor against central differences, not only against autograd. If you have misunderstood the loss, autograd will confirm your misunderstanding consistently.
4. **The training-equivalence run.** 200 steps with your gradients versus autograd, identical seeds: final losses agree to three decimals.
5. **Deliberate breakage.** For each of the three classic mistakes in the panel, confirm your harness catches it and record which tensors still look correct.

## Use the panel

Open the [panel](../../site/zero-to-hero.html?lecture=l5). It runs the check on a small two-layer network under four backward rules:

- **Correct derivation** — every tensor within `1e-5` of central differences.
- **Forget the `1/batch` factor** — every tensor wrong by the same factor. The loss still falls when you train it, which is precisely the danger.
- **Forget to subtract the target** — wrong everywhere, and the model cannot learn to increase a correct class's probability.
- **Wrong orientation on the way back** — the last layer still checks out perfectly while the earlier layer is wrong. Look at the bars: a check that only covers the output layer would pass this.

The lesson to write in your notes: partial checks give false confidence, so check every tensor.

## Common failures and what they look like

| Symptom | Likely cause |
| --- | --- |
| Gradients off by a constant factor | The mean/sum mismatch in the loss, or a missing `1/B` |
| Gradients right for batch size 1, wrong for larger batches | A missing sum over the batch axis in `dW` or `db`, hidden by broadcasting |
| Only the first layer disagrees | A transpose error in the propagation to the input, as in the panel's fourth rule |
| Embedding gradients too small | Overwriting instead of accumulating for repeated indices |
| Batch-norm gradients close but not within tolerance | One of the three paths dropped, usually the variance path; the error shrinks as the batch grows, which makes it easy to dismiss |

## Exercises

1. Derive `dW = Xᵀ dY` from indices: write the scalar expression for one element of `W`'s gradient and collect terms.
2. Derive the batch-normalisation input gradient and simplify it to a form with no explicit loop over examples. Check it at batch sizes 2, 8, and 64.
3. Implement a fused "linear + `tanh`" backward pass and confirm it matches the two separate steps, then measure whether it is faster in your setup.
4. Derive the gradient of cross-entropy when the targets are a probability distribution rather than one-hot, and say what changes.
5. Take one gradient and implement it wrongly on purpose, train for 500 steps, and record how far the loss curve falls. Keep the plot: it is the clearest argument for gradient checks you will ever produce.

## Transfer task

Without the video: implement a `check_gradients(forward, params, seed)` helper that, for an arbitrary scalar-output function, compares your analytic gradients to central differences for every parameter tensor and returns a per-tensor report. Then use it on a function the lecture never covered — a layer-normalised linear block — and report the results. This utility is reused in [lab 04-03](../labs/04-03.md) when you verify a GPU kernel.

## Where this goes next

Lecture 6 returns to architecture with the shape discipline you just earned, restructuring a flat context into a hierarchy. Keep the checking harness: it is what will let you trust an attention implementation in lecture 7.
