# Module 1: practical deep-learning foundations

Full route: Weeks 1–2, 104 hours. Bootcamp: Week 1, 52 hours including placement. Prerequisite: basic programming and quantitative reasoning.

## Outcome

You can turn a differentiable objective into a reliable training loop, verify its gradients, and distinguish optimization failure from generalization failure.

## Concepts to explain

For a batch of logits Z and one-hot labels Y, mean cross-entropy has gradient `(softmax(Z) - Y) / B`. Subtract a row maximum before exponentiation. A low training loss says the optimizer fit those examples; it does not establish predictive performance on new data.

Autograd applies the chain rule to a computation graph. Tensor shape, reduction, dtype, device, and gradient lifetime are part of the algorithm. Compare SGD, momentum, AdamW, initialization, weight decay, normalization, learning-rate schedules, and gradient clipping. Explain why accumulation and dropout complicate naive equivalence checks. Use [D2L](https://d2l.ai/) as a targeted reference.

## Labs

1. Complete the placement diagnostic. Implement stable softmax/cross-entropy in NumPy and check finite differences in float64; compare PyTorch autograd on the identical inputs.
2. Train an MLP on generated nonlinear classification data. Sweep three learning rates and compare SGD/momentum/AdamW with an equal step/data budget. Tune each optimizer fairly or label the experiment an untuned comparison.
3. Train a small convolutional classifier on generated images of shifted horizontal/vertical bars with added noise. Compare an MLP under the same split; hold out some positions/noise settings. Explain locality, weight sharing, and distribution shift. This is a learning task, not a vision benchmark.
4. Run tiny-batch overfit and random-label controls. Save predictions and loss curves. Diagnose a deliberately broken loop: omitted gradient reset, detached loss, wrong labels, or evaluation in training mode.

Save implementation, tests, environment, commands, and a two-page report in your own project directory. Use the [experiment standard](../docs/07-experiments.md).

## Gate

On a new dataset or loss, independently derive a gradient, verify it, and repair one injected training failure. Explain train/validation/test roles, bias/variance, optimizer state, and why seed control does not always imply bitwise determinism.

CPU is sufficient. Stretch: a tiny reverse-mode autodiff engine and directional derivative tests. Skip the stretch in the bootcamp unless the core is already fluent.
