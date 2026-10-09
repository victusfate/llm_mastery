# Lecture 2 · Language modelling by counting, then by training

**Watch:** [The spelled-out intro to language modeling: building makemore](https://www.youtube.com/watch?v=PaCmpygFfXo) (Andrej Karpathy)
**Reference code:** [makemore](https://github.com/karpathy/makemore) and the [lecture notebooks](https://github.com/karpathy/nn-zero-to-hero), MIT licensed
**Panel:** [a counting model is already a language model](../../site/zero-to-hero.html?lecture=l2)
**Assessed in:** [lab 01-01](../labs/01-01.md) and [lab 02-04](../labs/02-04.md)

## The mechanism in plain terms

A language model assigns a probability to the next symbol given what came before. Nothing about that definition requires a neural network. Take a list of words, add a boundary symbol at each end so the model can learn how words start and stop, and count how often each character follows each other character. Normalise each row of counts and you have a conditional distribution: a bigram model.

Its quality is one number. For every adjacent pair in your data, take the probability the model assigned, take the logarithm, average, and negate. That is **negative log likelihood**, measured in nats per symbol, and lower is better. Two reference points make it meaningful:

- A model that knows nothing assigns `1/V` to everything and scores `log V`. With 27 symbols that is about 3.30 nats.
- A model that assigned probability 1 to every observed symbol would score 0, which is only achievable by memorising.

```run
const model = z2h.trainBigram(data.NAMES);
print("bigram loss", model.loss.toFixed(4),
      "· uniform baseline", z2h.uniformLoss(model.characters.length).toFixed(4));
const random = z2h.rng(11);
const words = Array.from({ length: 6 }, () => z2h.sampleBigram(model, random));
print("samples:", words.join(" "));
```


The second half of the lecture reaches the same model a different way: one linear layer over a one-hot input, trained by gradient descent on cross-entropy. It converges to almost exactly the counting solution, because that is what the objective's optimum is. This equivalence is worth internalising — the counting model is the closed-form answer, and gradient descent is a general method that finds it without knowing the closed form. Adding weight decay to the trained version behaves like adding a constant to every count: both pull the distribution toward uniform.

Zero counts are the first real modelling decision. An unseen pair gets probability zero, one such pair in the evaluation data makes the whole likelihood zero, and the loss becomes infinite. Adding a constant `k` to every count ("add-k" smoothing) fixes the infinity and costs accuracy on the pairs you did observe.

```run
for (const k of [0, 0.5, 1, 2, 5]) {
  const loss = z2h.trainBigram(data.NAMES, k).loss;
  print("smoothing", k, "| training loss", loss.toFixed(4));
}
// Training loss rises with k. Explain why that is the price of a finite loss
// on a held-out word containing a pair the training data never showed.
```


## Before you watch: predict in writing

1. With 27 symbols, what loss does a uniform model achieve? Compute it, do not estimate.
2. Your dataset never contains the pair `qz`. What probability does the unsmoothed model assign, and what does that do to the evaluation loss?
3. If you add 1 to every count, does training loss rise or fall? Which pairs lose the most probability mass?
4. A bigram model samples `ana`, `mar`, `elis`. What structural property of real names can it not represent at all?

## Watch plan

| Segment | What to extract |
| --- | --- |
| Reading the dataset and building the vocabulary | Why a boundary symbol is needed, and why one symbol is enough for both ends |
| The count matrix and its visualisation | That the model *is* the matrix, and row normalisation is the only training step |
| Sampling | How a multinomial draw turns a row into a character, and why seeding matters for reproducibility |
| Negative log likelihood | The exact arithmetic: log of the assigned probability, averaged over all pairs, negated |
| The one-layer network version | Which tensor operation replaces the lookup, and why cross-entropy on logits is the same objective |
| Smoothing and regularisation | The correspondence between adding counts and penalising weights |

## Implement it yourself

Write two models over the same data and compare them.

**Data**
- a list of lowercase words (use your own list; ours is in `src/site/z2h-data.ts` if you want the same numbers as the panel)
- a sorted vocabulary with a boundary symbol at index 0, plus both index maps
- a function producing all `(previous, next)` index pairs, with boundaries

**Model A: counts**
- a `V × V` integer matrix of counts
- row-normalise with an add-`k` parameter to get probabilities
- `loss(words)` returning mean negative log likelihood per pair
- `sample(seed)` drawing from a row until the boundary symbol is drawn

**Model B: trained**
- one-hot the previous character, multiply by a `V × V` weight matrix to get logits
- softmax and cross-entropy against the next character, mean over the batch
- full-batch gradient descent for a few hundred steps

**Comparison**
- report both losses to three decimals and the largest absolute difference between the two probability matrices

### Starting point for Colab or your own machine

The cells above run in this page, in JavaScript, because a browser can execute
them with nothing installed. The exercise itself is PyTorch, so here is the same
idea in the language you will actually write it in. Paste it into
[Colab](https://colab.research.google.com/) or a local notebook and build
outwards from it — it is a starting point, not a solution.

```python
# The counting model, and the one number it is judged by.
import torch

words = ["ada", "nora", "elias"]            # your own list, one word per line
chars = ["."] + sorted({c for word in words for c in word})
index = {c: i for i, c in enumerate(chars)}

pairs = [(p, n) for word in words for p, n in zip("." + word, word + ".")]
counts = torch.zeros(len(chars), len(chars))
for previous, following in pairs:
    counts[index[previous], index[following]] += 1

smoothed = counts + 1
probs = smoothed / smoothed.sum(dim=1, keepdim=True)
loss = -torch.stack([probs[index[p], index[n]] for p, n in pairs]).log().mean()

print("loss", loss.item(), "uniform baseline", torch.tensor(float(len(chars))).log().item())
# Sample with torch.multinomial on one row, and stop at index 0.
```

## Checks that must pass

1. **Rows are distributions.** Every row of the probability matrix sums to 1 within `1e-9`, and no entry is negative.
2. **Beats the baseline.** The counting model's loss is strictly below `log V`. If it is not, your pair extraction is wrong.
3. **Smoothing monotonicity.** Training loss increases monotonically as `k` grows, and the loss for a held-out word containing an unseen pair is finite for any `k > 0` and infinite for `k = 0`.
4. **The two models agree.** After training, model B's probabilities match model A's (with matched smoothing and regularisation) to within `0.01` in the largest element. Report the number you actually get, not "close enough".
5. **Sampling is faithful.** Draw 100,000 samples from one row, tabulate the empirical frequencies, and assert each is within a few standard errors of the row probability. A sampler that quietly favours index 0 passes every other check.
6. **Reproducibility.** The same seed produces the same words. Record the seed in your lab notes.

## Use the panel

Open the [panel](../../site/zero-to-hero.html?lecture=l2) and:

- Move the smoothing slider from 0 to 5 and watch the loss rise. Explain the direction in one sentence before you move it.
- Read the "most likely next" table: which characters most often precede the boundary? That is the model's entire notion of how a word ends.
- Change the sampling seed and look at the generated words. Nothing in them is longer-range than one character of context — find an output that makes that obvious.
- Compare the two bars: bigram loss against the uniform baseline. The gap is the total value of first-order structure in this data.

## Common failures and what they look like

| Symptom | Likely cause |
| --- | --- |
| Loss is infinite or `nan` on evaluation | An unseen pair with `k = 0`, or a `log` of a zero probability |
| Loss is suspiciously low | Evaluating on the training words while claiming a held-out number, or counting pairs twice |
| Samples never end | The boundary symbol is missing from the transition rows, or the sampling loop ignores index 0 |
| Trained model plateaus well above the count model | Learning rate too small for the step count, or the loss is summed rather than averaged so the effective rate is wrong |
| Trained model beats the count model | Almost certainly an evaluation mismatch; the counting solution is optimal for this objective |

## Exercises

1. Extend to a trigram model by conditioning on two previous characters. Report the training and held-out losses and the number of parameters, then explain why the held-out loss may be worse than the bigram's.
2. Split your word list 80/10/10 and report all three losses. Which split do you tune `k` on, and why is it not the test split?
3. Derive why the count model is the maximum-likelihood solution for this objective. Two lines of algebra on a single row is enough.
4. Add a temperature to sampling. At temperature 0.1 and 2.0, describe what happens to the outputs and say which loss, if any, changes.
5. Implement the loss twice: once with explicit `log` of normalised probabilities, once with a numerically stable log-sum-exp over logits. Compare results when a logit is 100.

## Transfer task

Without the video: build the same bigram model over **words** rather than characters, using a short text of your own. Report the loss, the vocabulary size, the fraction of held-out pairs that were unseen in training, and what that fraction implies for the smoothing choice. Then state one sentence about why character models rarely face that problem and word models always do.

## Where this goes next

Lecture 3 replaces the lookup table with an embedding plus a hidden layer, which is the first model that can generalise across contexts it has never seen. The loss you computed here is the number you will compare against for the rest of the course — keep it in your notes with the dataset and seed that produced it.
