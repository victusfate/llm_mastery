# Module 1: understand and verify a training loop

Bootcamp Week 1 · 52 hours including placement, labs, and review. Full route: Weeks 1–2. Your engineering and mathematical background is assumed; the focus is translating it into reliable deep-learning practice.

**Start by reading this walkthrough and listening to the chapter lecture.** The numerical questions come after the explanation. Every highlighted concept opens a deeper field-guide entry; selecting an unfamiliar phrase offers a contextual lookup.

## Learning sequence

| Part | Work | Suggested first pass |
| --- | --- | --- |
| Read and listen | Chapters 1–4: model, tensor shapes, loss, and gradients | 40–60 minutes |
| Follow the example | Chapters 5–6: verified NumPy loss and a PyTorch training loop | 60–90 minutes |
| Experiment | Chapter 7: overfit, random labels, failure injection | 60–120 minutes |
| Build and demonstrate | Dedicated Labs 01-01 through 01-04 | Remaining module implementation time |
| Retrieve and defend | Chapter 8 and a fresh theory/practical check | During review hours |

This first pass orients you; completing the labs and independent gate takes longer. No GPU rental is needed. Start on CPU so numerical and data bugs are easy to inspect.

## 1. From a familiar model to a neural classifier

In weighted least squares, you choose parameters that minimize a discrepancy between predictions and observations. A neural network follows the same broad pattern, but the prediction function is a composition of differentiable operations and the loss must match the task.

For a two-class classifier, take input features X with shape B×d. A two-layer MLP computes hidden activations H=ReLU(XW1+b1), then logits Z=HW2+b2. The weights and biases are learned parameters. H and Z are activations that depend on both the input and those parameters.

The nonlinearity matters. Composing only linear maps still produces a linear map, so adding linear layers alone cannot solve a genuinely nonlinear classification boundary. ReLU applies max(0,x) componentwise and changes the function family.

Our first objective is modest: know exactly what one training update means. We will check a loss on two examples, derive its gradient, verify it numerically, and then connect it to a network. You should be able to reject an incorrect agent-generated training loop even if its plots look plausible.

**Observe:** model parameters determine predictions; labels determine the target; the loss measures disagreement; the optimizer changes parameters using gradients. Data loading and evaluation decide whether that numerical process answers the question you intended.

## 2. Make tensor shapes part of the specification

Use B=4 examples, d=2 features, h=8 hidden features, and C=2 classes for the first network.

| Quantity | Shape | Meaning |
| --- | --- | --- |
| X | 4×2 | Four inputs, two features each |
| W1 and b1 | 2×8 and 8 | First affine transformation |
| H | 4×8 | Hidden activations after ReLU |
| W2 and b2 | 8×2 and 2 | Output affine transformation |
| Z | 4×2 | Two logits for each example |
| y | 4 | Integer class index for each example |
| L | scalar | Mean loss over the four examples |

These are mathematical matrix conventions. A framework layer may store its weight transposed internally; inspect its contract rather than forcing a shape based on memory.

Broadcasting is convenient, but a valid broadcast can implement the wrong objective. If a loss unexpectedly has shape B×B instead of B, it may be comparing every prediction with every label. Assert shapes at the boundary of the first implementation.

**Walkthrough action:** write the shape beside every intermediate in your scratch file. Count parameters: W1 contributes 16, b1 contributes 8, W2 contributes 16, and b2 contributes 2, for 42 total. Batch size changes activation size, not this parameter count.

## 3. Turn scores into probabilities and a loss

Logits are scores, not probabilities. Softmax converts them using p_i=exp(z_i)/sum_j exp(z_j). For two scores [ln(3),0], the probabilities are [0.75,0.25].

For a one-hot target, cross-entropy is −ln(p_correct). This is the negative log-likelihood of the observed label. It penalizes assigning very little probability to the correct outcome. It uses natural logarithms here, so the unit is nats.

Now use two examples. Example A has logits [ln(3),0] and correct class 0, giving loss −ln(0.75)≈0.287682. Example B has logits [0,0] and correct class 1, giving loss −ln(0.5)≈0.693147. The mean batch loss is approximately **0.490415**.

Numerical stability is part of correctness. Compute log probabilities from shifted logits: subtract the row maximum, then subtract log(sum(exp(shifted_logits))). Do not first round a tiny probability to zero and then take its logarithm. Subtracting a common maximum changes neither the probabilities nor the mathematical loss.

**Interactive experiment:** after this section, use the softmax sandbox. Raise temperature with logits fixed and watch the distribution flatten. That changes the sampling distribution; it does not train the model. Then explain why adding the same constant to every logit leaves the distribution unchanged.

## 4. Derive the signal that moves the parameters

For one example with correct class k, write the loss as L=−z_k+log(sum_j exp(z_j)). Differentiating with respect to logit z_i gives p_i−1[i=k]. For a mean over B examples, divide each row’s contribution by B.

For the two-example batch above, the gradient with respect to logits is:

```text
[[-0.125,  0.125],
 [ 0.250, -0.250]]
```

The signs make sense: gradient descent increases the correct-class logit and decreases the incorrect-class logit. The uncertain second example produces a larger magnitude signal than the already more confident first one.

The network’s parameter gradient then follows the chain rule through the output layer, activation, and earlier layer. Autograd computes that composition, but it cannot know whether your label mask, target alignment, or reduction matches your intent.

A centered finite difference gives an independent check: [L(z+h)−L(z−h)]/(2h). Perturb one logit at a time in float64. A moderate small h, such as 1e-5 for this example, should closely match the analytical gradient. Extremely small h can worsen the estimate because of cancellation.

**Observe before testing:** every row of this softmax cross-entropy gradient sums to zero. This is consistent with the constant-shift invariance of the objective. Check the property and explain it instead of treating a passing assertion as a mystery.

## 5. Run the complete numerical walkthrough

The repository includes a small executable worked example. It implements stable cross-entropy, checks the known loss and gradient, compares finite differences, verifies constant-shift invariance, and checks an extreme-logit case.

From the repository root, in your own environment with NumPy installed:

```bash
python examples/foundations_walkthrough.py
```

[Read the complete source](../examples/foundations_walkthrough.py). This is a teaching example you are encouraged to inspect before the independent lab. It updates the logits directly for one demonstration; a real neural training loop updates parameters through the chain rule.

Expected observations: the starting loss prints 0.490415, the displayed gradient matches Chapter 4, and a small descent step reduces the loss. For logits [1000,−1000] with class 1 correct, the stable loss is 2000 rather than infinity. The exact extreme case deliberately checks the log-probability calculation.

Now change one thing at a time. Swap a label and predict the gradient signs. Change the reduction from mean to sum and predict the factor. Add 1000 to every logit and predict which values stay unchanged. Do the calculation first; then run it.

When something fails, keep the smallest failing input. Check labels, dtype, shape, and reduction before touching the optimizer. Your first dedicated lab extends this example and compares it with PyTorch autograd.

## 6. Connect the loss to a PyTorch training loop

A small model can be expressed with `Linear(2,8)`, `ReLU()`, and `Linear(8,2)`. PyTorch’s cross-entropy loss expects raw logits and integer class labels for this standard setup. Applying softmax first is unnecessary and changes what that loss receives.

The important update sequence is:

```python
model.train()
optimizer.zero_grad(set_to_none=True)
logits = model(x_batch)
loss = torch.nn.functional.cross_entropy(logits, y_batch)
loss.backward()
optimizer.step()
```

Every line has a job. Training mode configures layers such as dropout. Clearing gradients avoids unintended accumulation. The forward pass constructs predictions and a computation graph. Backward computes gradients. The optimizer uses those gradients and its state to update parameters.

For evaluation, use `model.eval()` and an appropriate no-gradient context. Evaluation mode and disabling gradient tracking are different: one configures layer behavior, the other controls graph recording. Neither establishes that your data split is independent.

Before comparing optimizers, make the same tiny batch fit. If it will not, inspect labels, graph connectivity, reduction, learning rate, and the update sequence. Once the loop is verified, compare SGD, momentum, and AdamW over stated learning-rate choices and equal training budgets. An untuned comparison should be labeled as such.

Checkpointing should save enough to continue training, including optimizer state and progress. Reconstructing weights alone may reproduce predictions but not the next training update. Later modules deepen this into distributed recovery.

## 7. Use controls to distinguish learning from a convincing plot

A tiny-batch overfit test asks whether your model and optimizer can fit a deliberately small set. Success supports implementation capability on that case. It does not establish generalization.

A random-label control changes the question. A sufficiently flexible model may fit arbitrary training labels while remaining near chance on independently labeled unseen examples. That outcome illustrates why low training loss is not a complete evaluation.

For the nonlinear classification lab, generate separate training and validation examples under a recorded process. For the small image lab, generate horizontal and vertical bars with shifts and noise, then hold out selected positions or noise levels. This tests how an MLP and convolutional network handle a specific spatial transfer problem.

Treat anomalies as experimental evidence. If validation accuracy is implausibly perfect, check overlap and labels. If loss oscillates, inspect the learning rate and gradient norms. If memory grows every step, check whether you retain graphs in logs. If a supposedly frozen model changes, inspect parameter updates and stochastic state.

**Interactive experiment:** in the gradient-descent sandbox, move the learning rate across 2 for the simple loss x²/2. Explain the transition from convergence to oscillation to divergence. Then state why this boundary does not carry over directly to a neural network with different curvature.

## 8. Build, retrieve, and demonstrate understanding

Complete the four dedicated labs in order. Each opens a separate page with its own guidance and evidence record. You can use agents for scaffolding and implementation, but you own the predictions, numerical checks, interpretation, and final transfer task.

After the walkthrough, switch to Retrieve & test for the short numerical checks. Then explain the following in your own words: why logits are not probabilities; why the gradient is p−y before batch reduction; what autograd does and cannot verify; and what an overfit control establishes.

For the practical gate, use a fresh input or small model that is not the worked example. Derive or verify the relevant gradient, repair an injected failure, and explain training versus validation behavior. Keep code, commands, and actual observations. A saved note or a correct quiz answer does not certify the entire module.

## Labs

1. [Lab 01-01: stable loss and verified gradients](../site/lab.html?lab=01-01). Implement, perturb, compare with autograd, and explain the result.
2. [Lab 01-02: train and compare small networks](../site/lab.html?lab=01-02). Generate nonlinear data, verify a training loop, and compare optimizer settings fairly.
3. [Lab 01-03: convolution and spatial transfer](../site/lab.html?lab=01-03). Generate images and compare inductive biases under a protected split.
4. [Lab 01-04: controls and failure diagnosis](../site/lab.html?lab=01-04). Overfit, randomize labels, inject bugs, and defend your diagnosis.

## Gate

Independently derive or numerically verify a loss gradient, debug a fresh broken training loop, and explain the gap between training success and generalization. Score using the [mastery rubric](../assessments/01-mastery.md). Preserve the distinction between assisted construction and independent understanding.

## Reading and lecture context

The chaptered narration is original course text, spoken with a New Zealand neural voice. Read the accompanying transcript as you listen and pause between chapters to manipulate an example or inspect code. [Lecture transcript](../docs/13-foundations-lecture.md).

**Zero to Hero pairing.** Lectures 1 to 6 of Andrej Karpathy's free series build exactly this module's machinery from nothing: a scalar autograd engine, a character language model, an MLP with real training controls, activation and gradient diagnostics, hand-derived tensor backward passes, and a hierarchical architecture. Work them through the [companion track](../docs/18-zero-to-hero.md), which adds our specifications, correctness checks, and interactive panels. Watching is not assessed; Labs 01-01 to 01-04 are.

Use [Dive into Deep Learning](https://d2l.ai/) as a supporting textbook for tensors, MLPs, convolution, and optimization. Subsequent language-model architecture material is linked in the [reading library](../docs/06-resources.md). Do not treat a tokenization lecture as a replacement for understanding gradients in this module.

## Dedicated lab pages


- [Lab 01-01: Stable loss and verified gradients](../site/lab.html?lab=01-01) · [Markdown guide](../docs/labs/01-01.md)
- [Lab 01-02: Train and compare small neural networks](../site/lab.html?lab=01-02) · [Markdown guide](../docs/labs/01-02.md)
- [Lab 01-03: Convolution and spatial generalization](../site/lab.html?lab=01-03) · [Markdown guide](../docs/labs/01-03.md)
- [Lab 01-04: Training controls and failure diagnosis](../site/lab.html?lab=01-04) · [Markdown guide](../docs/labs/01-04.md)
