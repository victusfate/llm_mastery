# Lecture 4 · Activations, gradients, and normalisation

**Watch:** [Building makemore Part 3: Activations & Gradients, BatchNorm](https://www.youtube.com/watch?v=P6sfmUTpUmc) (Andrej Karpathy)
**Reference code:** [makemore](https://github.com/karpathy/makemore), MIT licensed
**Background papers:** [Glorot & Bengio, 2010](https://proceedings.mlr.press/v9/glorot10a/glorot10a.pdf) · [He et al., 2015](https://arxiv.org/abs/1502.01852) · [Batch Normalization](https://arxiv.org/abs/1502.03167)
**Panel:** [see initialisation before training anything](../../site/zero-to-hero.html?lecture=l4)
**Assessed in:** [lab 01-04](../labs/01-04.md) and [lab 02-03](../labs/02-03.md)

## The mechanism in plain terms

A deep network is a long product. Signals multiply their way forward through weight matrices; gradients multiply their way back through the same matrices and through each nonlinearity's local derivative. Whether either survives the trip depends on scale, and scale is something you set at initialisation.

Consider a layer with fan-in `n`, inputs with unit variance, and weights drawn from a Gaussian with standard deviation `σ`. The pre-activation variance is `n · σ²`. To keep the variance at 1, you need `σ = 1/√n`. That is the entire content of "careful initialisation": a factor chosen so the signal neither grows nor shrinks layer by layer. Nonlinearities change the constant — `relu` discards half the signal, so the compensating factor is `√2/√n` — but not the shape of the argument.

Two failure modes follow immediately:

- **Too large.** Pre-activations are big, `tanh` outputs sit at ±1, and the local derivative `1 - tanh(x)²` is near zero. The forward pass looks lively and the backward pass carries almost nothing. Units that are saturated for *every* example in the batch are dead: no gradient reaches their weights at all.
- **Too small.** Activations shrink toward zero with depth. Later layers see almost no variation, gradients are tiny, and training is slow in a way that looks like a bad learning rate.

The last layer deserves special attention. At the start of training you want the output distribution to be roughly uniform, which means logits near zero, which means scaling the final weights down. Otherwise the first steps are spent undoing a confidently wrong initialisation, which shows up as a sharp initial drop in loss that teaches you nothing.

**Normalisation** attacks the problem differently: instead of choosing the scale so activations stay well behaved, standardise them explicitly. Batch normalisation subtracts the batch mean and divides by the batch standard deviation per unit, then applies a learned scale and shift. The consequences are real and worth stating plainly:

- It removes most of the sensitivity to initialisation scale, which is why it made deep networks practical.
- It couples examples within a batch: a prediction now depends on the other examples it was batched with. That is a strange property for a model to have, and it forces a separate inference path using running statistics.
- Its interaction with the preceding layer's bias is redundant (the mean subtraction removes it), and with weight decay it is subtle.
- The alternatives you will meet later — layer normalisation and RMS normalisation — avoid the batch coupling, which is why transformers use them instead.

The diagnostic habit is the real deliverable: before training, look at per-layer activation histograms, the saturated fraction, and gradient magnitudes. These three plots find in one minute what a loss curve hides for an hour.

## Before you watch: predict in writing

1. A layer has fan-in 100 and weights from `N(0, 1)`. What is the pre-activation standard deviation, and what fraction of `tanh` outputs will be beyond ±0.97?
2. You multiply every weight in a 5-layer `tanh` network by 3. What happens to the forward activations, and to the gradient reaching layer 1?
3. Why does scaling down only the *final* layer's weights change the shape of the first 100 steps of the loss curve?
4. With batch normalisation, what is the model's prediction for a single test example, and where do the statistics come from?

## Watch plan

| Segment | What to extract |
| --- | --- |
| Fixing the initial loss | Why logits should start near zero and how to arrange that |
| Saturated `tanh` and dead units | The picture: a histogram pinned at the extremes, and what it implies for gradients |
| The `1/√fan-in` argument | The variance calculation, done once, applies everywhere |
| Batch normalisation | What is computed, what is learned, and what changes at inference |
| Diagnostic plots | Activation distributions, gradient distributions, update-to-weight ratios |
| The `torch.nn`-style refactor | How these ideas package into reusable layer objects |

## Implement it yourself

Instrument the model from lecture 3 rather than writing a new one.

**Initialisation control**
- a `gain` parameter multiplying `1/√fan-in` for every hidden layer
- a separate, smaller scale for the output layer

**Diagnostics, as functions returning numbers**
- per-layer activation mean, standard deviation, and the fraction with `|a| > 0.97`
- per-layer gradient standard deviation on the backward pass
- the ratio of update magnitude to parameter magnitude per tensor, per step
- histograms you can print as text if you prefer not to plot

**Batch normalisation, written by hand**
- batch mean and variance per unit, with `eps` inside the square root
- learned scale and shift
- running estimates updated during training and used at evaluation
- a flag that switches between train and eval behaviour, and an assertion that they differ

**Comparison**
- a 5-layer `tanh` network at gains `0.5`, `1.0`, `3.0`, with and without normalisation, reporting the diagnostics above and the dev loss after a fixed budget

## Checks that must pass

1. **Variance arithmetic.** Empirically measure pre-activation variance for a layer with fan-in 100 at `σ = 1/√100` and assert it is within 10% of 1 over a batch of 1,000.
2. **Initial loss.** With the output layer scaled down, the loss at step 0 is within 0.05 of `log V`. Assert it; do not eyeball the curve.
3. **Train/eval difference.** A batch-normalised model produces different outputs in train and eval mode for the same input, and eval outputs are independent of the other examples in the batch. Assert both — the second by evaluating one example alone and inside a batch.
4. **Gradient survival.** In a 5-layer network at gain 3, assert the first layer's gradient standard deviation is at least an order of magnitude below the last layer's, and that normalisation reduces that ratio. Report the numbers.
5. **Dead units.** Count units saturated across the entire batch. Assert the count is zero at your chosen initialisation.
6. **Finite-difference check of your batch norm backward pass**, if you wrote it by hand. This is the single most error-prone derivation in the lecture.

## Use the panel

Open the [panel](../../site/zero-to-hero.html?lecture=l4):

- Set the gain to 2.5 with 5 layers. Read the saturated percentage and the first-layer gradient standard deviation; the histogram shows the mass pinned in the dark bands.
- Drop the gain to 0.4. Saturation disappears and the activation standard deviation collapses with depth instead. Both extremes are broken, in opposite directions.
- Tick **Normalise each layer over the batch** and repeat both extremes. Note how little the statistics now depend on the gain, and say what that buys you and what it costs.
- Increase the depth to 8 at gain 1.0 and watch the per-layer curves separate. Extrapolate: at 40 layers, what would you need besides good initialisation?

## Common failures and what they look like

| Symptom | Likely cause |
| --- | --- |
| Loss starts near 3.3, drops sharply within ten steps, then crawls | Output layer initialised too large; the fast drop is just fixing the initial confidence |
| Loss decreases very slowly from the start, no instability | Gain too small; activations and gradients vanish with depth |
| Training loss good, evaluation loss much worse only with batch norm | Running statistics not updated, or eval mode not switched on |
| Results change when the batch size changes | Expected with batch norm: the statistics depend on the batch. Document it |
| `nan` appearing in the first backward pass | Division by a zero variance; `eps` missing or applied outside the square root |

## Exercises

1. Derive the `√2/√n` factor for `relu` from the variance argument, then verify it empirically.
2. Replace batch normalisation with layer normalisation (statistics over features, per example) and compare the diagnostics. Explain which property of batch norm you just gave up and which problem you solved.
3. Plot the update-to-weight ratio per tensor over training. Identify a layer whose ratio is an order of magnitude off the others and say what you would change.
4. Set the batch size to 1 with batch normalisation active. Explain the result rather than fixing it.
5. Remove the bias from a layer that is immediately followed by batch normalisation, and confirm empirically that the loss curve is unchanged. Explain why.

## Transfer task

Without the video: write a `diagnose(model, batch)` utility that returns a dictionary of per-layer activation statistics, gradient statistics, and saturated fractions, and prints a compact table. Run it on a network you deliberately misinitialise and show that the table identifies the faulty layer before any training happens. [Lab 01-04](../labs/01-04.md) assesses exactly this diagnostic ability.

## Where this goes next

Lecture 5 removes the framework's backward pass entirely and makes you derive these gradients at tensor level — including the batch-normalisation backward pass you may have just written by hand. Keep your diagnostics; they are how you will debug the transformer in lecture 7.
