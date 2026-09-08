export const modules = [
  {
    title: "Training foundations",
    weeks: "01",
    file: "01-foundations",
    visual: "softmax",
    concept: "A training loop is a numerical experiment.",
    summary:
      "Start with a loss you can calculate by hand. Verify its gradient, overfit a tiny batch, then separate optimization from generalization.",
    prediction:
      "If every logit gains 1,000, should the predicted probabilities change? Explain before moving the temperature slider.",
    lab: "Implement stable NumPy cross-entropy and compare finite differences with autograd. Then diagnose a missing gradient reset in a tiny MLP.",
    defense:
      "Why can random labels be fitted without useful generalization? What would falsify your diagnosis?",
    video: "SQ3fZ1sAqXI",
  },
  {
    title: "Build a transformer",
    weeks: "02",
    file: "02-transformer",
    visual: "attention",
    concept: "The mask defines what the model is allowed to know.",
    summary:
      "Track Q, K, V and score shapes. Causal attention blocks future information. Shift the targets so each position predicts the next token.",
    prediction:
      "If you alter the final input token, which earlier outputs may change when dropout is off?",
    lab: "Build a tiny causal decoder from tensor operations. Demonstrate future-token invariance and compare forward/backward results to a reference.",
    defense:
      "How could a reversed mask produce deceptively good training loss?",
    video: "ptFiH_bHnJw",
  },
  {
    title: "Curate and pretrain",
    weeks: "03–05",
    file: "03-pretraining",
    visual: "softmax",
    concept: "Data processing is part of the model.",
    summary:
      "Preserve provenance from documents to shards. Group duplicates before splitting. Compare curation choices at an explicit training budget.",
    prediction:
      "If a filter removes half the corpus but training tokens stay fixed, what else changes?",
    lab: "Create a two-source streaming pipeline, plant duplicate leakage, audit rejected records, and run a matched-token comparison.",
    defense:
      "Which confound remains if the curated model sees twice as many epochs?",
  },
  {
    title: "GPU and distributed systems",
    weeks: "06–09",
    file: "04-systems",
    visual: "descent",
    concept: "Measure the limiting resource before optimizing.",
    summary:
      "A faster kernel may leave end-to-end time unchanged. DDP synchronizes replicas; network traffic and the slowest worker matter.",
    prediction:
      "Will a 5080 and 5090 across Ethernet always outperform the 5090 alone?",
    lab: "Profile your trainer, verify a custom kernel, then compare single-worker and two-node gradients at equal effective batch.",
    defense:
      "How do you distinguish communication cost from input-pipeline starvation?",
  },
  {
    title: "Scaling and evaluation",
    weeks: "10–11",
    file: "05-scaling-evaluation",
    visual: "descent",
    concept: "An empirical fit has a domain of validity.",
    summary:
      "Match the resource that answers your question. Keep evaluation independent. Report seed variation separately from example-level uncertainty.",
    prediction:
      "If two models use different tokenizers, are their token perplexities directly comparable?",
    lab: "Run a tiny iso-compute comparison, predict an omitted configuration, and audit evaluation denominators and caches.",
    defense: "What evidence would make you distrust your apparent improvement?",
  },
  {
    title: "Supervised adaptation",
    weeks: "12–13",
    file: "06-sft",
    visual: "attention",
    concept: "The labels and template define the supervised task.",
    summary:
      "Inspect exactly which tokens receive loss. Prompt, padding, EOS and truncation behavior can change your objective silently.",
    prediction:
      "What changes if prompt tokens mistakenly receive the same loss weight as answers?",
    lab: "Print token/label pairs for five chat examples. Compare full and adapter tuning, then evaluate capability regressions.",
    defense:
      "Why does fitting the model weights in VRAM not establish that training will fit?",
  },
  {
    title: "Policy gradients",
    weeks: "14–15",
    file: "07-rl",
    visual: "bandit",
    concept: "Debug the estimator where the true answer is known.",
    summary:
      "Expected reward can be differentiated exactly in a tiny bandit. Compare sampled gradients before introducing long trajectories and value estimates.",
    prediction:
      "Which has a larger logit gradient: p(A)=0.5 or p(A)=0.99, with fixed rewards?",
    lab: "Compare exact and Monte Carlo bandit gradients. Add a baseline, then implement tiny actor-critic/PPO and termination tests.",
    defense:
      "Why may a baseline reduce variance without changing the expected gradient?",
  },
  {
    title: "Preferences and RLHF",
    weeks: "16–18",
    file: "08-alignment",
    visual: "bandit",
    concept: "Improving a proxy is not the same as improving the task.",
    summary:
      "Separate current, old rollout, and reference policies. Test DPO log ratios and text PPO on tiny cases. Evaluate reward exploitation independently.",
    prediction:
      "Can a reward model get higher scores while answer correctness falls?",
    lab: "Verify DPO on hand-computable pairs; build a minimal PPO update and a deliberate format-reward exploit.",
    defense:
      "Where do the old policy and fixed reference appear, and why are they different?",
  },
  {
    title: "Reasoning RL",
    weeks: "19–21",
    file: "09-reasoning-rl",
    visual: "bandit",
    concept: "The verifier is part of the training system.",
    summary:
      "Test parsers adversarially. Equal-reward groups may provide no centered reward signal. Track policy versions and inference budgets.",
    prediction:
      "If all sampled answers are wrong, what signal does group-relative centering provide?",
    lab: "Build arithmetic tasks, verifier tests, and a group-relative update. Compare base/SFT/RL at fixed pass@1 generation budgets.",
    defense:
      "What would distinguish new task learning from extra inference compute?",
  },
  {
    title: "Capstone and contribution",
    weeks: "22–24",
    file: "10-research",
    visual: "descent",
    concept: "Make one claim another engineer can check.",
    summary:
      "Reuse your strongest baseline, change one thing, and defend the result. A useful null finding or well-tested upstream fix can be valuable.",
    prediction: "What observation would overturn your capstone hypothesis?",
    lab: "Freeze an experimental plan, run the intervention and ablations, prepare a reproduction package, and defend it without assistance.",
    defense:
      "Which parts are demonstrated locally, externally reviewed, and still unmeasured?",
  },
];
