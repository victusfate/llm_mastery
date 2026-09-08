# Module 6: supervised adaptation and instruction data

Full route: Weeks 19–21, 156 hours. Bootcamp: Weeks 12–13, 104 hours. Dependency: reliable pretraining/evaluation.

## Outcome

You can adapt a pretrained model, verify exactly which tokens receive loss, and separate changes in task performance from changes in formatting or memorization.

## Concepts to explain

SFT minimizes negative log probability on selected target tokens. In chat data, the template and label mask define the task. Padding, EOS, role markers, packing, truncation, and assistant-only loss can silently alter the objective. Adapter tuning changes only a subspace of parameters; it is not equivalent to full training. Read [LoRA](https://arxiv.org/abs/2106.09685) and use [TRL](https://huggingface.co/docs/trl/index) after verifying the basic loss yourself.

## Labs

1. Create a small instruction dataset from a reproducible arithmetic/string-transformation generator. Split by template or parameter family, not just random rows. Record generator version and avoid test-template exposure.
2. Render five multi-turn examples and print token/label alignment. Hand-check that prompt/padding labels are excluded and intended assistant tokens included. Check EOS, empty response, truncation, and packed-document boundaries.
3. Train a full-parameter tiny baseline and an adapter variant under explicit budgets. Count trainable parameters, optimizer memory, tokens, and step time. On a larger open checkpoint, use the memory-saving option supported by the measured fit.
4. Compare raw versus cleaned demonstrations or two data mixtures with the training budget controlled. Evaluate base and adapted models on held-out tasks plus a small regression suite. Check changes in verbosity, refusal, formatting, and correctness separately.
5. Freeze a well-described SFT checkpoint as the reference for subsequent alignment work, with tokenizer, template, revision, and data metadata.

## Gate

Given an unfamiliar chat example, explain every supervised token and repair an incorrect mask. Show a controlled adaptation result and diagnose at least one capability regression or failure mode. A favorable sample is not a substitute for the fixed evaluation.

Stretch: continued pretraining before SFT, synthetic-data filtering, or preference-data construction. Do not use a tutorial’s final checkpoint as evidence that you trained it.

## Dedicated lab pages

- [Lab 06-01: Generate instruction data with protected splits](../site/lab.html?lab=06-01) · [Markdown guide](../docs/labs/06-01.md)
- [Lab 06-02: Inspect chat templates and supervised labels](../site/lab.html?lab=06-02) · [Markdown guide](../docs/labs/06-02.md)
- [Lab 06-03: Full versus adapter fine-tuning](../site/lab.html?lab=06-03) · [Markdown guide](../docs/labs/06-03.md)
- [Lab 06-04: Demonstration quality and behavioral regressions](../site/lab.html?lab=06-04) · [Markdown guide](../docs/labs/06-04.md)
- [Lab 06-05: Freeze a reproducible reference policy](../site/lab.html?lab=06-05) · [Markdown guide](../docs/labs/06-05.md)
