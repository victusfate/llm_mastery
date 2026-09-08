# Prerequisite bridge: use only where needed

Experienced engineers should test out of this material. Pick a block from diagnostic evidence; do not complete an introductory syllabus by default.

| Block | Suggested allocation | Work and exit check |
| --- | --- | --- |
| Python/tensors | 1–2 weeks | Implement a streaming iterator, vectorized loss, tests, and a small training loop; explain aliasing and broadcasting |
| Linear algebra/calculus | 2–4 weeks | Matrix products, projections, chain rule, Jacobian-vector products; derive and numerically verify linear/logistic regression gradients |
| Probability/experimental reasoning | 1–2 weeks | Expectation, conditional probability, likelihood, variance, bootstrap; explain leakage and a paired comparison |
| Practical deep learning | 2–4 weeks | Train MLP/CNN, overfit a batch, diagnose normalization and learning-rate failures, checkpoint and reproduce |

Allocations are course estimates; beginners may need much longer. Use [Dive into Deep Learning](https://d2l.ai/) sections on preliminaries, linear networks, MLPs, optimization, and convolution. Read the relevant section, implement a small case, then close it and reproduce the idea.

Do not spend a month relearning mathematics you already apply successfully. For a targeted gap, ask the tutor to connect it to least squares, simulation, or classical ML and immediately test that connection in code.
