# Lecture 3 · Embeddings, a hidden layer, and honest evaluation

**Watch:** [Building makemore Part 2: MLP](https://www.youtube.com/watch?v=TCH_1BHY58I) (Andrej Karpathy)
**Reference code:** [makemore](https://github.com/karpathy/makemore), MIT licensed
**Background paper:** [A Neural Probabilistic Language Model](https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf) (Bengio et al., 2003)
**Panel:** [train a character MLP in this tab](../../site/zero-to-hero.html?lecture=l3)
**Assessed in:** [lab 01-02](../labs/01-02.md) and [lab 01-04](../labs/01-04.md)

## The mechanism in plain terms

A counting model treats every context as unrelated to every other. With three characters of context and 27 symbols there are 19,683 contexts, most of which your data never contains, and counting has nothing to say about them.

An embedding fixes this by giving each symbol a short vector of learned numbers. Contexts are then represented by concatenating their symbols' vectors, and because similar symbols end up with similar vectors, a context the model has never seen can still land near one it has. That is the whole generalisation argument: **share statistical strength through a learned representation instead of memorising cells in a table.**

The architecture is small and complete:

1. Look up one vector per context position in an embedding table of shape `V × d`.
2. Concatenate them into a vector of length `context × d`.
3. One hidden layer with `tanh`.
4. A linear projection to `V` logits, then softmax cross-entropy against the next symbol.

Everything else in this lecture is the practical machinery you will use for the rest of your career: minibatches, a learning-rate search, train/dev/test splits, and the distinction between a model that is too small to fit the data and one that has memorised it.

Three ideas to get exactly right:

- **Minibatches** trade gradient accuracy for update frequency. A noisy gradient computed on 32 examples, applied 100 times, beats an exact gradient applied once.
- **A learning rate is found, not guessed.** Sweep it over orders of magnitude on a short run, plot loss against the exponent, and choose from the region where loss falls fastest without instability. Then decay it late in training.
- **Three splits, three purposes.** Train fits parameters. Dev chooses hyperparameters. Test is touched once, at the end, and every extra look at it converts it into a dev set.

The gap between training loss and dev loss is the quantity that tells you what to do next. Both high: the model or the training budget is too small. Training low and dev much higher: you are memorising, and more data, smaller models, or regularisation are the remedies.

```run
for (const learningRate of [0.05, 0.4, 1.2]) {
  const run = z2h.trainCharMLP({ words: data.NAMES, steps: 400, learningRate, seed: 4 });
  print("lr", String(learningRate).padEnd(5),
        "| train", run.trainLoss.toFixed(3), "| held-out", run.heldOutLoss.toFixed(3));
}
// Does the learning rate that wins on training loss also win on held-out loss?
```


## Before you watch: predict in writing

1. With `V = 27`, `d = 10`, context 3, and 200 hidden units, how many parameters does the model have? Write the arithmetic, not just the total.
2. Which parameters receive a gradient when the batch contains only the letters `a` and `b`? Specifically, what happens to the embedding rows of the other 25 symbols?
3. If you raise the hidden width from 200 to 2,000 on a dataset of 30,000 words, which of training loss and dev loss do you expect to fall, and which to rise?
4. You sweep the learning rate and find the loss lowest at the largest value tried. What does that tell you, and what do you do next?

## Watch plan

| Segment | What to extract |
| --- | --- |
| Building the context dataset | How a sliding window over a padded word produces `(context, target)` rows |
| The embedding lookup | That indexing a table *is* a matrix multiply with a one-hot vector, done cheaply |
| Shapes and concatenation | The exact shape at each step; write them down as you go |
| Minibatch training | Why the loss curve becomes noisy and why that is not a problem |
| Learning-rate search | The procedure, not the specific number it produces |
| Splits, over- and underfitting | Which loss you are allowed to report, and when |
| Visualising the embedding | What structure a two-dimensional embedding can show, and its limits |

## Implement it yourself

**Data**
- build `(context, target)` pairs with a fixed context length and a boundary symbol for padding
- split into train, dev, and test by **word**, never by pair, so the same word cannot appear in two splits

**Model**
- embedding table `V × d`
- hidden layer of width `H` with `tanh`
- output layer to `V` logits
- cross-entropy loss, mean over the batch, computed with a numerically stable routine

**Training**
- minibatches of 32 with a seeded random index draw
- a learning-rate sweep: 1,000 steps at each of ten rates spanning `1e-3` to `1e0`, recording the loss
- a full run at your chosen rate, with a single decay late in training
- report train, dev, and (once, at the very end) test loss

**Inspection**
- sample words from the trained model
- with `d = 2`, plot the embedding and label each point with its symbol

### Starting point for Colab or your own machine

The cells above run in this page, in JavaScript, because a browser can execute
them with nothing installed. The exercise itself is PyTorch, so here is the same
idea in the language you will actually write it in. Paste it into
[Colab](https://colab.research.google.com/) or a local notebook and build
outwards from it — it is a starting point, not a solution.

```python
# The context dataset and one complete training step.
import torch
import torch.nn.functional as F

context, embed, hidden, V = 3, 10, 200, len(chars)

X, Y = [], []
for word in words:
    window = [0] * context
    for character in word + ".":
        X.append(window)
        Y.append(index[character])
        window = window[1:] + [index[character]]
X, Y = torch.tensor(X), torch.tensor(Y)

g = torch.Generator().manual_seed(1)
C = torch.randn(V, embed, generator=g)
W1 = torch.randn(context * embed, hidden, generator=g) / (context * embed) ** 0.5
b1 = torch.zeros(hidden)
W2 = torch.randn(hidden, V, generator=g) * 0.01      # small: start near uniform
b2 = torch.zeros(V)
parameters = [C, W1, b1, W2, b2]
for p in parameters:
    p.requires_grad_()

batch = torch.randint(0, X.shape[0], (32,), generator=g)
h = torch.tanh(C[X[batch]].view(32, -1) @ W1 + b1)
loss = F.cross_entropy(h @ W2 + b2, Y[batch])

for p in parameters:
    p.grad = None                                    # never skip this
loss.backward()
for p in parameters:
    p.data -= 0.1 * p.grad
print(loss.item())
```

## Checks that must pass

1. **Shapes.** Assert the shape of every intermediate tensor against a written expectation. Shape bugs that broadcast silently are the most expensive bugs in this lecture.
2. **Overfit a tiny subset.** Train on 20 examples until the loss is near zero. If it will not, the model or the loss is wrong and no hyperparameter will save it.
3. **Baseline comparison.** Your dev loss must be lower than the bigram dev loss from lecture 2 on the same split. If it is not, you have not gained anything from the extra machinery.
4. **Split integrity.** Assert that no word appears in more than one split, and that dev loss computed twice gives identical numbers (no dropout or sampling leaking into evaluation).
5. **Gradient check.** On a two-example batch, compare a few analytic gradients with finite differences. Keep the habit from lecture 1 even when the framework is doing the work.
6. **Determinism.** Fix all seeds and assert two runs produce identical losses. Without this, you cannot attribute a change to your intervention.

## Use the panel

Open the [panel](../../site/zero-to-hero.html?lecture=l3), which trains a small MLP in your browser on a 125-word list:

- Press **Train the model** at the default settings and note training loss, held-out loss, and the bigram baseline. The held-out gap is large because the dataset is tiny — that is the point.
- Raise the steps to 1,200. Training loss falls; watch what held-out loss does. Write the number down before and after.
- Drop the learning rate to 0.05 and retrain. Distinguish "not converged yet" from "converged to a worse place".
- Look at the embedding scatter after a long run. Do the vowels end up near each other? Say what you can and cannot conclude from two dimensions.
- Set the context to 1 and compare against your bigram loss. This is the same model family as lecture 2 plus a hidden layer.

More context is more parameters and a wider gap between the two losses:

```run
for (const context of [1, 2, 3, 4]) {
  const run = z2h.trainCharMLP({ words: data.NAMES, steps: 400, context, seed: 4 });
  print("context", context, "| params", String(run.parameters).padStart(4),
        "| train", run.trainLoss.toFixed(3), "| held-out", run.heldOutLoss.toFixed(3));
}
```


## Common failures and what they look like

| Symptom | Likely cause |
| --- | --- |
| Loss is flat at `log V` | Embeddings or weights are all zeros, or the target indices are misaligned with the contexts |
| Loss falls then jumps to `nan` | Learning rate too high, or an unstable softmax implemented as `log(exp(x)/sum)` |
| Dev loss lower than train loss | An evaluation bug: different preprocessing, or a leak that put dev words in the training set |
| Training loss keeps falling, dev loss rises steadily | Memorisation; report the epoch where dev loss turned and stop there |
| Both losses stall well above the bigram baseline | Context window built incorrectly, so the model predicts from padding |

## Exercises

1. Sweep `d ∈ {2, 4, 8, 16}` at fixed everything else and plot dev loss against `d`. Choose a value and justify it in one sentence that mentions the dev set.
2. Replace `tanh` with `relu` and compare. Then explain why the dead-unit failure mode differs between them.
3. Implement early stopping on dev loss with a patience of 200 steps. Report the step it chose across three seeds.
4. Train on 10%, 30%, and 100% of the words and plot the train–dev gap against dataset size. State what the trend predicts for 10× more data.
5. Deliberately leak: put 10% of dev words into training and report the new dev loss. Record the size of the improvement so you recognise that signature later.

## Transfer task

Without the video: implement a **learning-rate finder** as a reusable function. It takes a model factory, a data iterator, a range of rates, and a step budget; it returns the rate that minimised loss and the full curve. Use it on this model and one unrelated one (a small regression, for example), and state the one failure mode the finder cannot detect. [Lab 01-04](../labs/01-04.md) asks you to diagnose training failures with exactly this kind of tooling.

## Where this goes next

Lecture 4 asks why this network trains at all, and what breaks when it gets deeper: the scale of the initial weights determines whether activations saturate and whether gradients reach the early layers. Keep this model — the next lecture instruments it rather than replacing it.
