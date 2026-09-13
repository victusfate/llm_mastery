# Lecture 6 · Hierarchical context and shape discipline

**Watch:** [Building makemore Part 5: Building a WaveNet](https://www.youtube.com/watch?v=t3YJ5hKiMQ0) (Andrej Karpathy)
**Reference code:** the [lecture notebooks](https://github.com/karpathy/nn-zero-to-hero), MIT licensed
**Background paper:** [WaveNet](https://arxiv.org/abs/1609.03499) (van den Oord et al., 2016)
**Panel:** [widen the context without one enormous layer](../../site/zero-to-hero.html?lecture=l6)
**Assessed in:** [lab 01-03](../labs/01-03.md) and [lab 02-02](../labs/02-02.md)

## The mechanism in plain terms

The model from lecture 3 takes its context by concatenating every position's embedding into one long vector and squashing it through a single hidden layer. Doubling the context doubles that layer's parameters, and every position is mixed with every other in one step, at one level of abstraction.

A hierarchy does it differently. Combine adjacent pairs of positions into one representation, then combine adjacent pairs of *those*, and so on. After `k` levels, each output depends on `2^k` original positions, and the model has built intermediate representations of short spans — letter pairs, then quadruples — instead of jumping straight from characters to a prediction. This is the structural idea behind dilated causal convolutions in WaveNet, arrived at here without convolution machinery: a fan-in of 2, repeated.

The honest accounting matters, and it is the part most summaries get wrong. A hierarchy is **not** automatically smaller. One wide layer costs `context × embedding × hidden` parameters, growing linearly with context. A hierarchy costs one input level plus `k - 1` hidden-to-hidden levels, growing with the *logarithm* of the context. At short contexts the hierarchy costs more because each level carries a full `hidden × hidden` matrix; at long contexts it wins, and where the crossover sits depends on the hidden width. Find the crossover for your configuration before claiming an efficiency gain — the panel computes it for you.

```run
const plan = z2h.contextPlan({ fanIn: 2, depth: 4, hidden: 64, embedding: 16 });
for (const point of plan.scaling) {
  print("context", String(point.contextLength).padStart(3),
        "| one wide layer", String(point.flat).padStart(8),
        "| hierarchy", String(point.hierarchical).padStart(8),
        point.hierarchical < point.flat ? "← hierarchy cheaper" : "");
}
```


The second half of this lecture is not about architecture at all. It is about the working habits that keep a growing model correct:

- **Shapes are the specification.** Write the expected shape of every tensor in a comment, and assert the important ones. Most bugs in a restructured model are shape bugs that broadcast into something plausible rather than crashing.
- **Batched dimensions are free, until they are not.** A layer written for `(batch, features)` usually works for `(batch, group, features)` because matrix multiplication applies to the trailing axis — but normalisation, reductions, and views do not follow automatically. Check each.
- **Packaging layers into objects** with a `parameters()` method and a `__call__` is what makes a deep stack readable. This is also how frameworks are structured, so the refactor teaches you to read them.
- **Reading documentation is the job.** A significant fraction of this lecture is spent finding out what a library function actually does to shapes. That is not a detour; it is the skill.

## Before you watch: predict in writing

1. With fan-in 2 and 4 levels, how many context positions does one output depend on?
2. Compare parameter counts at context 8, embedding 16, hidden 64: one wide layer versus a 3-level hierarchy with fan-in 2. Which is larger? Now do it at context 64.
3. You reshape a tensor of shape `(32, 8, 10)` into `(32, 4, 20)`. Which original positions end up in each group, and what assumption about memory layout are you relying on?
4. Batch normalisation is applied to a tensor of shape `(batch, group, features)`. Over which axes should the statistics be computed, and how many mean values does that produce?

## Watch plan

| Segment | What to extract |
| --- | --- |
| The layer-object refactor | The interface: forward call, parameter list, train/eval state |
| Growing the network deeper | Why a flat concatenation becomes the bottleneck |
| The tree-structured combination | Which positions are grouped at each level, and the shape after each step |
| Shape debugging | The habit of printing and asserting shapes at every step |
| Normalisation in more than two dimensions | Which axes the statistics run over once a group axis exists |
| Performance and diagnostics | That a deeper model does not automatically improve the dev loss |

## Implement it yourself

**Layer objects**
- `Linear`, `Tanh`, `BatchNorm1d`, `Embedding`, `FlattenConsecutive(n)`, and a `Sequential` container
- each exposes `parameters()`; the normalisation layer exposes a train/eval flag
- `FlattenConsecutive(n)` turns `(B, T, C)` into `(B, T/n, C*n)`, and asserts `T % n == 0`

**The hierarchical model**
- embedding, then `k` repetitions of (flatten consecutive `n`, linear, normalise, `tanh`), then a final linear to logits
- a context length equal to `n^k` so the tree is exact

**Instrumentation**
- print the shape after every layer for one batch, and keep the printout in your notes
- report total parameters, and the same for a flat model at the same context length
- per-layer activation and gradient statistics, reusing lecture 4's diagnostics

**Comparison**
- flat versus hierarchical at contexts 4, 8, and 16, matched on parameter count as closely as you can, at a fixed step budget; report dev loss for each

## Checks that must pass

1. **Shape assertions.** Every layer asserts its input rank and the divisibility it requires. A wrong context length must raise immediately, not train.
2. **Grouping is correct.** Feed a tensor whose values encode their position index, run the flatten, and assert that each group contains the positions you intended, in order.
3. **Parameter accounting.** Your reported parameter count matches a hand-derived formula exactly. Off-by-a-bias errors here mean your comparison is not matched.
4. **Causality preserved.** No output depends on a position later than its target. Assert it directly: change the last context position of a row and confirm which outputs move.
5. **Normalisation axes.** With a group axis present, assert that the running statistics have the shape you expect and that eval mode is independent of batch composition.
6. **Matched comparison.** When you claim the hierarchy is better, state parameter counts, step budget, and seeds for both models. Anything else is not a comparison — see the [experiment standards](../07-experiments.md).

## Use the panel

Open the [panel](../../site/zero-to-hero.html?lecture=l6):

- Set fan-in 2 and 3 levels: 8 context positions. Read both parameter counts and note which design is cheaper here.
- Watch the crossover readout as you raise the hidden width from 16 to 256. A wider hidden layer pushes the crossover to longer contexts, because the hierarchy's cost is dominated by `hidden × hidden` matrices.
- Change fan-in to 4 with 3 levels: 64 positions in three levels. Fewer levels, wider groups — state one advantage and one disadvantage.
- Read the scaling table: one column grows linearly, the other logarithmically. Identify the row where they cross and explain what changes if the embedding is 64 instead of 16.

The crossover is not a fixed fact about hierarchies; it moves with the hidden width:

```run
for (const hidden of [16, 64, 256]) {
  const plan = z2h.contextPlan({ fanIn: 2, depth: 8, hidden, embedding: 16 });
  const crossover = plan.scaling.find(point => point.hierarchical < point.flat);
  print("hidden", String(hidden).padStart(3), "→ hierarchy becomes cheaper at context",
        crossover ? crossover.contextLength : "beyond this range");
}
```


## Common failures and what they look like

| Symptom | Likely cause |
| --- | --- |
| Loss is worse than the flat model despite more parameters | Groups are not adjacent positions; the reshape mixed the wrong axes |
| A reshape silently succeeds but the model learns nothing useful | Memory-layout assumption wrong: positions interleaved instead of grouped |
| Normalisation makes results depend on batch composition at eval | Statistics computed over the wrong axes once a group axis exists |
| Works at one context length only | Missing divisibility assertion; the model is silently truncating |
| Deeper model trains more slowly per step and no better per step | Expected: depth is not free. Report time per step alongside loss |

## Exercises

1. Derive closed-form parameter counts for both designs and check them against your implementation for three configurations.
2. Implement the same grouping as a strided one-dimensional convolution and assert both produce identical outputs. Then say which you would rather debug.
3. Vary fan-in at fixed context length (2 with 4 levels, 4 with 2 levels) and report dev loss, parameter count, and step time.
4. Remove normalisation from the hierarchy and use lecture 4's diagnostics to explain what happens at depth 4.
5. Build a receptive-field test: for each output position, determine empirically which input positions can influence it, by perturbing one input at a time. Compare against your intended design.

## Transfer task

Without the video: write `assert_receptive_field(model, context)` that determines, by perturbation alone, which input positions affect each output, and fails if any output depends on a future position or misses a position it should see. Run it against a deliberately misgrouped model and show the failure. [Lab 02-02](../labs/02-02.md) uses the same technique on attention.

## Where this goes next

Lecture 7 replaces this fixed hierarchy with attention, where the combination weights are computed from the data instead of being baked into the structure. Your shape discipline and your receptive-field test both transfer directly, and the causality assertion becomes the central test of the decoder.
