# Module 8: preferences, RLHF, and alignment failures

Full route: Weeks 25–28, 208 hours. Bootcamp: Weeks 16–18, 156 hours. Dependencies: SFT and toy PPO.

## Outcome

You can train a reward model, implement DPO, integrate minimal text PPO, and detect optimization of a proxy that diverges from intended behavior.

## Concepts to explain

A common pairwise reward objective is `-log sigmoid(r(x,y_chosen)-r(x,y_rejected))`. Preference labels can encode annotator biases, ambiguity, and noise. Synthetic preferences are useful for mechanics but are not human feedback.

For a fixed reference policy, define `delta = [log pi_theta(y_c|x)-log pi_ref(y_c|x)] - [log pi_theta(y_r|x)-log pi_ref(y_r|x)]`. DPO minimizes `-log sigmoid(beta * delta)`. Sequence log probabilities sum over response tokens; substituting a mean changes the objective and must be labeled. Read [DPO](https://arxiv.org/abs/2305.18290).

In PPO-based RLHF, distinguish the **current trainable policy**, the **old rollout policy**, the **fixed reference**, the **reward model**, and the **value estimator**. The old policy supplies importance ratios; the reference constrains drift. Read [InstructGPT](https://arxiv.org/abs/2203.02155) for the overall workflow.

## Labs

1. Build a small preference dataset with known construction rules and a held-out split by prompt family. Include deliberately noisy labels and length-confounded pairs. Train a reward head and audit accuracy, calibration, and reward-versus-length behavior.
2. Implement DPO directly from token log probabilities. Compare a tiny numerical case to a trusted implementation; test masking, identical policies, chosen/rejected reversal, and frozen reference gradients. Sweep beta and label noise.
3. Implement minimal text PPO on a tiny policy and short responses. Log reward, reference KL estimate, entropy, ratio/clip fraction, value loss, response length, and validity. Validate one update independently before larger runs. Then inspect a maintained trainer implementation.
4. Train SFT, DPO, and PPO variants from the same SFT reference where applicable. Report compute/data differences explicitly; preference training and online RL do not consume identical resources. Evaluate on the same held-out prompts and generation budget.
5. Create a proxy-reward failure, such as rewarding a format marker regardless of answer correctness. Show the divergence between proxy reward and true task success. Add a targeted mitigation and retest.
6. Use a benign behavior suite to inspect instruction following, spurious refusal, robustness to misleading instructions, and reward overoptimization. Discuss why these tests do not establish comprehensive alignment or safety.

## Gate

Implement the DPO toy objective without a trainer, identify policy roles in PPO, and demonstrate a reward-hacking failure with independent evaluation. Explain why DPO is preference optimization and does not involve online rollouts in its standard offline form.

Small CPU/text pilots pass the algorithmic checks. Meaningful model comparisons use a measured local-GPU configuration. Stretch: process rewards, preference uncertainty, or alternative preference objectives; one well-understood method beats a shallow survey.

## Dedicated lab pages

- [Lab 08-01: Preference data and reward-model bias](../site/lab.html?lab=08-01) · [Markdown guide](../docs/labs/08-01.md)
- [Lab 08-02: DPO from response log probabilities](../site/lab.html?lab=08-02) · [Markdown guide](../docs/labs/08-02.md)
- [Lab 08-03: A minimal text PPO update](../site/lab.html?lab=08-03) · [Markdown guide](../docs/labs/08-03.md)
- [Lab 08-04: Compare SFT, DPO, and PPO](../site/lab.html?lab=08-04) · [Markdown guide](../docs/labs/08-04.md)
- [Lab 08-05: Construct and mitigate reward exploitation](../site/lab.html?lab=08-05) · [Markdown guide](../docs/labs/08-05.md)
- [Lab 08-06: Behavioral alignment evaluation](../site/lab.html?lab=08-06) · [Markdown guide](../docs/labs/08-06.md)
