# The Zero to Hero companion track

[Neural Networks: Zero to Hero](https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ) is a free lecture series by Andrej Karpathy in which a language model is built from scratch, one layer of machinery at a time: a scalar autograd engine, a character-level model, an MLP, the diagnostics that make deep networks trainable, hand-derived backpropagation, a hierarchical architecture, a decoder-only transformer, a byte-pair tokenizer, and finally a reproduction of GPT-2 (124M).

This track is our study apparatus around that series. The videos and notebooks are his; the study plans, exercises, interactive panels, runnable samples, and assessments on these pages are ours. Nothing from the videos is transcribed or copied here — see [licensing and attribution](zero-to-hero/licensing.md).

**Open the track in the workbench:** [nine lecture pages with interactive panels](../site/zero-to-hero.html) (run `npm run dev` first, or use the hosted course). Each page carries the video link, our study guide, a panel whose numbers are computed in your browser, and an editable code sample you can run.

## Why this sits inside the course

The series and this course answer different questions. The series answers *how does each piece work, in code, with nothing hidden*. The course answers *how do you run a controlled experiment, at a budget, and defend the result*. The series is the fastest way to earn the mechanical fluency that our labs then assess, so it belongs at the start of modules 1 and 2 rather than as optional extra reading.

Two things the series deliberately does not cover, and the course does: data curation and provenance at corpus scale ([module 3](../modules/03-pretraining.md)), and everything after pretraining — systems measurement, scaling and evaluation discipline, supervised fine-tuning, preference learning, and reasoning RL ([modules 4 to 10](02-curriculum.md)). Finishing all nine lectures gives you a working transformer and the ability to debug one. It does not give you frontier-scale operating experience, and no amount of small-scale work substitutes for that.

## The nine lectures

| # | Lecture | Mechanism it establishes | Course home | Our guide |
| --- | --- | --- | --- | --- |
| 1 | The spelled-out intro to neural networks and backpropagation: building micrograd | Reverse-mode differentiation as local rules applied in reverse order | [Module 1](../modules/01-foundations.md), labs [01-01](labs/01-01.md), [01-02](labs/01-02.md) | [Guide](zero-to-hero/l1-micrograd.md) |
| 2 | The spelled-out intro to language modeling: building makemore | Next-symbol prediction, cross-entropy, and a baseline to beat | [Module 1](../modules/01-foundations.md), labs [01-01](labs/01-01.md), [02-04](labs/02-04.md) | [Guide](zero-to-hero/l2-bigram.md) |
| 3 | Building makemore Part 2: MLP | Embeddings, splits, learning-rate search, over- and underfitting | [Module 1](../modules/01-foundations.md), labs [01-02](labs/01-02.md), [01-04](labs/01-04.md) | [Guide](zero-to-hero/l3-mlp.md) |
| 4 | Building makemore Part 3: Activations & Gradients, BatchNorm | Initialisation scale, saturation, gradient flow, normalisation | [Module 1](../modules/01-foundations.md), labs [01-04](labs/01-04.md), [02-03](labs/02-03.md) | [Guide](zero-to-hero/l4-activations.md) |
| 5 | Building makemore Part 4: Becoming a Backprop Ninja | Tensor-level backward passes you can audit | [Module 1](../modules/01-foundations.md), labs [01-01](labs/01-01.md), [04-03](labs/04-03.md) | [Guide](zero-to-hero/l5-backprop.md) |
| 6 | Building makemore Part 5: Building a WaveNet | Hierarchical context, shape discipline, reading documentation | [Module 1](../modules/01-foundations.md), labs [01-03](labs/01-03.md), [02-02](labs/02-02.md) | [Guide](zero-to-hero/l6-wavenet.md) |
| 7 | Let's build GPT: from scratch, in code, spelled out | Self-attention, causal masking, residual blocks | [Module 2](../modules/02-transformer.md), labs [02-02](labs/02-02.md), [02-03](labs/02-03.md), [02-04](labs/02-04.md) | [Guide](zero-to-hero/l7-gpt.md) |
| 8 | Let's build the GPT Tokenizer | Byte-pair encoding as a separate model with its own training set | [Module 2](../modules/02-transformer.md), lab [02-01](labs/02-01.md) | [Guide](zero-to-hero/l8-tokenizer.md) |
| 9 | Let's reproduce GPT-2 (124M) | Parameter accounting, throughput, schedules, reproduction as bookkeeping | [Modules 3–5](../modules/03-pretraining.md), labs [03-05](labs/03-05.md), [03-06](labs/03-06.md), [04-01](labs/04-01.md), [05-01](labs/05-01.md) | [Guide](zero-to-hero/l9-gpt2.md) |

Lectures 1 to 8 and their notebooks are listed in [karpathy/nn-zero-to-hero](https://github.com/karpathy/nn-zero-to-hero); lecture 9 has its own repository, [karpathy/build-nanogpt](https://github.com/karpathy/build-nanogpt). Video identifiers and repository links on these pages were taken from those two repositories on September 12, 2026. Playlists change; if a link moves, prefer the repository list over ours and open an issue.

## How to work a lecture

Watching is the cheapest part and teaches the least. Use this loop for each lecture:

1. **Read our guide first** (10 minutes). It states the mechanism, the thing you should be able to do afterwards, and what to predict.
2. **Predict, in writing.** Answer the guide's prediction prompts before the video. A wrong written prediction is worth more than a right passive nod.
3. **Watch in 10–20 minute segments.** Stop at each segment boundary, close the video, and restate the mechanism from memory. If you cannot, rewatch that segment rather than continuing.
4. **Implement from our specification, not from the screen.** Each guide gives an implementation spec with explicit inputs, outputs, and invariants. Typing along with a video produces working code and no diagnostic skill. Write it yourself, then compare.
5. **Run the correctness checks.** Every guide includes checks that fail loudly when the implementation is wrong: finite-difference comparisons, round trips, invariance assertions, baseline comparisons. A falling loss is not a check.
6. **Use the interactive panel** on the [track page](../site/zero-to-hero.html) to probe the thing you just built: move one control, predict, observe, explain the difference in one sentence.
7. **Record evidence** in the note field and bring the gap you could not close to a tutor session, using the [tutoring protocol](03-working-together.md).

Budget two to four hours of your own implementation and debugging per hour of video. Runtimes vary from under an hour to several hours per lecture; check the playlist for current values rather than planning from a remembered number. A realistic pass through all nine lectures with real implementations, on the [schedule in the timeline](01-timeline.md), takes two to four weeks and overlaps modules 1 and 2 rather than preceding them.

## Prerequisites

Python and basic array programming, plus comfort with derivatives of simple functions. If the [placement diagnostic](../assessments/00-placement.md) shows gaps in calculus or arrays, spend a few days in the [prerequisite bridge](../modules/00-bridge.md) first. No GPU is needed for lectures 1 to 8; lecture 9's full reproduction needs rented hardware, and the guide explains what to do instead at zero cloud spend.

## What counts as evidence

Completing lectures is not assessed and never appears in the [mastery rubric](../assessments/01-mastery.md). The labs listed in the table above are what you defend. For each lecture, the evidence that matters is:

- your own implementation, in your own repository, with the guide's checks passing;
- one deliberately injected failure, its symptom, and the diagnostic path you used to find it;
- a fresh transfer task completed without the video open.

Assistance is allowed and should be labelled. If you asked an agent or watched the answer, record that in the note and schedule an independent transfer exercise later, as the [tutoring defaults](../AGENTS.md) require.

## Related course material

- [Interactive workbench guide](10-interactive.md) — how the panels, notes, and progress records work.
- [Reading library](06-resources.md) — the primary papers behind each lecture.
- [Experiment standards](07-experiments.md) — read before claiming any comparison you run here.
- [Home hardware](09-home-lab.md) — what will run on your machine, and what will not.
- [Licensing and attribution](zero-to-hero/licensing.md) — the license status of every work this track links to.
