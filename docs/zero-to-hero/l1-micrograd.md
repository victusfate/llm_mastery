# Lecture 1 · A scalar autograd engine

**Watch:** [The spelled-out intro to neural networks and backpropagation: building micrograd](https://www.youtube.com/watch?v=VMj-3S1tku0) (Andrej Karpathy)
**Reference code:** [micrograd](https://github.com/karpathy/micrograd) and the [lecture notebooks](https://github.com/karpathy/nn-zero-to-hero), both MIT licensed
**Panel:** [differentiate an expression you choose](../../site/zero-to-hero.html?lecture=l1)
**Assessed in:** [lab 01-01](../labs/01-01.md) and [lab 01-02](../labs/01-02.md)

## The mechanism in plain terms

A derivative is a local statement: if this input moves a little, how much does this output move. Nothing in a neural network needs a global derivative formula. Every operation knows its own local rule — multiplication passes the other factor, addition passes the gradient unchanged, `tanh` scales it by `1 - tanh(x)²` — and the chain rule says that composing operations composes those local rules by multiplication.

Reverse-mode automatic differentiation exploits one fact: a training step needs the derivative of **one** number (the loss) with respect to **many** parameters. So it runs the computation forward once, recording each operation and its inputs, then walks that record backwards, starting with `dloss/dloss = 1` and handing each node the gradient of the loss with respect to its own output. Each node multiplies by its local rule and passes the result to its inputs. One backward walk produces every parameter's gradient, at roughly the cost of the forward pass.

Two details do all the damage when they are missing:

- **Order.** A node can compute its inputs' gradients only after every consumer has contributed to its own. That requires a reverse topological order, not the order in which nodes were created.
- **Accumulation.** A value used in two places receives gradient from both paths, and those contributions add. `+=`, not `=`. This single character is the most common bug in a hand-written engine, and it is invisible in the loss.

Both claims are checkable right here. Predict each number before you run it:

```run
// A value used twice collects gradient from both paths.
const a = z2h.value(3, "a");
a.mul(a).backward();
print("d(a*a)/da at a = 3 →", a.grad, "· overwriting would give 3");

// tanh saturates: the output barely moves while the gradient collapses.
for (const x of [0.5, 1, 2, 4]) {
  const v = z2h.value(x, "x");
  const out = v.tanh();
  out.backward();
  print("x", x, "| tanh(x)", out.data.toFixed(4), "| gradient", v.grad.toFixed(6));
}
```


## Before you watch: predict in writing

1. For `L = a * b` with `a = 3`, `b = -2`: what are `dL/da` and `dL/db`?
2. For `L = a * a` with `a = 3`: what is `dL/da`, and how many gradient contributions does the node `a` receive?
3. If you call `backward()` twice without clearing gradients, what happens to the numbers, and why is the second call not simply idempotent?
4. `tanh` saturates: for large positive `x`, what is the local derivative, and what does that imply for anything upstream of it?

Write your answers down. The panel and the checks below will tell you which ones were wrong.

## Watch plan

Watch in segments and stop at each boundary to restate the idea without the video:

| Segment | What to extract |
| --- | --- |
| Derivatives of a simple function | That a derivative is measured, not just symbolic: nudge the input, divide the change |
| Building the value object and the graph | What must be stored per node: the data, the children, the operation, and a way to apply the local rule |
| One backward pass by hand | Why the order is reverse-topological and where the first `1.0` comes from |
| Neurons, layers, and a training loop | That a network is only a big expression, and that a step is: forward, backward, nudge, clear |
| The PyTorch comparison | Which parts of your engine correspond to which library concepts |

## Implement it yourself

Write this from the specification, not by typing along with the screen. Target: about 150 lines of Python, no dependencies except `math` and (for the comparison) `torch`.

**A `Value` class holding**
- `data: float`, `grad: float` initialised to `0.0`
- the set of parent values it came from, the operation's name, and a closure that applies the local rule to its own `grad`

**Operations**
- `__add__`, `__mul__`, `__pow__` (constant exponent), `__neg__`, `__sub__`, `__truediv__`
- `tanh` and `exp`; then implement `tanh` a second time from `exp` and check the two agree
- the reflected forms (`__radd__`, `__rmul__`) so `2 * x` works, and coercion so `x + 1` works

**`backward()`**
- build a topological order of the graph by depth-first traversal with a visited set
- set the output's `grad` to `1.0`
- walk the order in reverse, calling each node's local rule
- every write to a child's `grad` uses `+=`

**A small network**
- a `Neuron` with a weight per input plus a bias and a `tanh` nonlinearity
- a `Layer` of neurons and an `MLP` of layers, with a `parameters()` method
- a loss (start with mean squared error over four hand-written examples)
- a training loop: forward, zero every parameter's gradient, backward, subtract `learning_rate * grad`

Do not skip `parameters()` and the explicit zeroing. Half the value of this exercise is discovering what goes wrong when they are absent.

### Starting point for Colab or your own machine

The cells above run in this page, in JavaScript, because a browser can execute
them with nothing installed. The exercise itself is PyTorch, so here is the same
idea in the language you will actually write it in. Paste it into
[Colab](https://colab.research.google.com/) or a local notebook and build
outwards from it — it is a starting point, not a solution.

```python
# Check your own engine against PyTorch on the same expression.
import torch

a = torch.tensor(1.5, requires_grad=True)
b = torch.tensor(-2.0, requires_grad=True)
c = torch.tensor(0.5, requires_grad=True)

loss = (a * b + c) * torch.tanh(a)
loss.backward()

print("value", loss.item())
print("grads", a.grad.item(), b.grad.item(), c.grad.item())
# Your Value class must match these to about 1e-6. The operation that
# disagrees is the local rule to re-derive.
```

## Checks that must pass

These are the deliverables, not the loss curve.

1. **Finite differences.** For ten random expressions built from your operations, compare each variable's `grad` with `(f(x+h) - f(x-h)) / (2h)` at `h = 1e-5`. Assert the absolute difference is below `1e-6` for well-scaled values. Central differences, not one-sided: the error term is much smaller.
2. **Fan-out.** For `L = a * a` at `a = 3`, assert `a.grad == 6`. For `L = a * a * a`, assert `27`. If you see `3` and `9`, you are overwriting instead of accumulating.
3. **Second backward.** Call `backward()` twice without zeroing and assert the gradients exactly doubled. Then add `zero_grad()` and assert they do not.
4. **Library agreement.** Rebuild the same expression with `torch.tensor([...], requires_grad=True)`, call `.backward()`, and assert your gradients match to `1e-6`.
5. **Overfit.** Train your MLP on four examples until the loss is below `1e-4`. A model that cannot memorise four examples has a bug, not a learning-rate problem.

The finite-difference check is the one to internalise. Edit the function and see whether your intuition about its derivative survives:

```run
const check = z2h.checkValueGradients(
  ([a, b]) => a.mul(b).add(a.tanh()).relu(),   // change this function
  [0.7, -1.3],
);
print("analytic", check.analytic);
print("numeric ", check.numeric);
print("largest gap", check.maxError, check.maxError < 1e-6 ? "— agrees" : "— disagrees");
```


## Use the panel

Open the [interactive panel](../../site/zero-to-hero.html?lecture=l1) and:

- Type `a*a + a` and read the gradient of `a`. Predict it first from your own rules.
- Type `tanh(a)` and drag `a` to 3. Watch the gradient collapse toward zero while the value stays near 1. That is saturation, and it is lecture 4's entire subject.
- Type an expression with a division and set the denominator near zero. Note that the backward pass produces enormous numbers rather than an error — nothing in autograd protects you from a badly conditioned forward pass.
- Read the node table: the `gradient` column is exactly what your `backward()` should produce for the same expression.

### Cross-check your Python against the runnable sample

The sample below the panel exposes the same engine in the composed form you are
writing: `z2h.value(1.5, "a")` creates a leaf, operations are methods because
JavaScript has no operator overloading (`a.mul(b).add(c)` for `a * b + c`),
`loss.backward()` walks the graph in reverse, and `zeroGrad()` clears it.
`z2h.checkValueGradients(build, inputs)` runs the finite-difference comparison
for you, and `z2h.fitNetwork` trains a small network on four examples so you can
see what a working loop reaches. Use it as a second opinion when your Python
disagrees with your expectation — never as a substitute for writing your own.

Clearing gradients is the step everyone skips once. Run both and keep the two numbers:

```run
const examples = [
  { inputs: [2, 3], target: 1 }, { inputs: [3, -1], target: -1 },
  { inputs: [0.5, 1], target: -1 }, { inputs: [1, 1], target: 1 },
];
for (const clearGradients of [true, false]) {
  const fit = z2h.fitNetwork(new z2h.Network([2, 4, 4, 1], 3), examples,
                             { steps: 150, learningRate: 0.06, clearGradients });
  print(clearGradients ? "cleared each step " : "left in place    ",
        "→ final loss", fit.finalLoss.toFixed(6));
}
```


## Common failures and what they look like

| Symptom | Likely cause |
| --- | --- |
| Gradients are right for chains, wrong whenever a value is reused | Assignment instead of accumulation in the backward closure |
| Gradients are wrong by a factor that changes with graph shape | Nodes visited in creation order rather than reverse topological order |
| Loss falls for a few steps then explodes | Gradients never cleared, so each step uses a sum of all history |
| Loss does not move at all | `parameters()` misses some values, or the step updates a copy rather than the object |
| Finite differences disagree only for `tanh` at large inputs | Nothing is wrong: the true derivative is near zero and the difference quotient is dominated by floating-point error. Test at moderate inputs |

## Exercises

1. Add `log` and `relu`, derive their local rules, and extend the finite-difference test to cover them.
2. Implement `__pow__` for a `Value` exponent (not just a constant) and state the condition under which the derivative with respect to the exponent is defined.
3. Make `backward()` raise a clear error if called on a node that is not a scalar output of the graph it was built from.
4. Deliberately replace one `+=` with `=`, run your finite-difference test, and record which expressions still pass. Explain why the passing ones pass.
5. Count operations: for a graph with `n` nodes, how many local-rule applications does one backward pass perform, and how does that compare with computing each parameter's derivative by a separate finite difference?

## Transfer task

Without reopening the video: add a `softmax` over a list of `Value` objects and a cross-entropy loss against an integer label, and verify both with finite differences. Then explain in two sentences why subtracting the maximum logit before exponentiating changes nothing mathematically but everything numerically. This is the exact computation [lab 01-01](../labs/01-01.md) assesses.

## Where this goes next

Lecture 2 uses this understanding on real data: the loss becomes negative log likelihood over characters, and the question becomes what a model can learn from counting alone. Your engine stays useful as a reference implementation you can trust — when PyTorch later disagrees with your expectation, you now have something small enough to check by hand.
