# Placement diagnostic

Timebox: four hours. Use Python/NumPy/PyTorch documentation for syntax if necessary; no AI or reference solutions during the attempt. Record any assistance. If Python is unfamiliar, use C++ for the numerical task and separately demonstrate tensor fluency; syntax gaps and conceptual gaps are different.

## Tasks: 100 points

### A. Numerical implementation — 60 minutes, 25 points

Implement batched softmax and cross-entropy in NumPy without using a library loss. Inputs are a B×V matrix of logits and B integer labels. Return the mean loss and its gradient with respect to logits. Demonstrate behavior on logits containing 1000 and -1000. Check selected gradient entries with centered finite differences in float64. Explain the reduction factor and invariance to a constant logit shift.

Scoring: stable forward 8; correct gradient/reduction 8; numerical check 5; explanation 4.

### B. Training and diagnosis — 60 minutes, 25 points

Generate a two-class nonlinear dataset with a fixed seed and separate train/validation splits. Train a two-layer PyTorch MLP. Show that a tiny subset can be overfit, log losses, and explain what changes when labels are randomized. Save and reload model and optimizer state. Explain why training accuracy alone cannot establish generalization.

Scoring: functioning training 8; meaningful controls/splits 8; state handling 5; explanation 4.

### C. Transformer reasoning — 45 minutes, 20 points

Given B=2, T=8, d_model=32, heads=4, state the shapes of Q, K, V, attention scores, and the output. Write causal attention using tensor operations. Change token 7 and demonstrate that outputs at positions 0–6 do not change with dropout disabled. Explain input/target shifting and what happens if the mask direction is reversed.

Scoring: shapes 4; implementation 8; invariance test 4; explanation 4.

### D. Experiment design and resource reasoning — 45 minutes, 20 points

A filtered-data model has lower validation loss, but was trained for twice as many tokens as the baseline. Design a comparison that can distinguish filtering from extra training. Explain document-level splitting and near-duplicate contamination. Estimate parameter/optimizer memory for a 100M parameter model under an explicitly stated dtype/state layout; list omitted memory. Explain gradient accumulation and how it changes effective batch size.

Scoring: causal comparison 7; leakage 5; memory 4; accumulation 4.

### E. RL baseline knowledge — 30 minutes, 10 points

Explain policy, reward, return, value, advantage, and on-policy data. For a two-action bandit, write an expected-reward objective and propose how to estimate its gradient from samples. Explain one way a text policy could increase a reward score without improving the intended behavior.

Scoring: terminology 3; objective/gradient reasoning 5; failure example 2. A low score here is expected for the bootcamp’s target learner; it does not disqualify the route.

## Placement decisions

| Evidence | Route decision |
| --- | --- |
| A≥20, B≥20, C≥14, D≥14; substantial prior engineering | 24-week bootcamp, with RL learned in sequence |
| Strong A/B/D, weak C | Bootcamp with extra transformer time; reassess at Week 2 |
| A or B below 15 | Add focused foundations/bridge before expensive pretraining |
| Broadly weak programming/math | Bridge plus fuller 40-week route |
| Strong prior artifacts pass multiple later gates | Consider 18–20 week bootcamp only after fresh transfer tests |

An aggregate score never overrides a critical implementation gap. Have the tutor ask two follow-up questions and one small code modification before accepting a high score. For the initial experienced-engineer route, provisional placement is allowed; final pacing follows observed work.

The diagnostic specifies tasks and grading, not hidden claims that any learner has passed. Keep attempts under your own progress directory or private workspace.
