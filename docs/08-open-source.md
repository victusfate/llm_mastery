# Contribute early to established open initiatives

Checked September 8, 2026 against official repositories and issue pages. Issue status, ownership, and maintainer priorities can change. These are candidates to investigate, not verified bugs, reserved tasks, promises of merges, or offers of free cluster access.

## Recommended entry

**Start with EleutherAI’s LM Evaluation Harness or Hugging Face DataTrove in Week 1.** Your existing software, data-service, numerical, and debugging skills can be useful before you finish learning pretraining or RL. Then move toward Ai2’s OLMo-core for training systems and verl for RL infrastructure.

| Initiative | Why it belongs here | Initial work with little/no cloud spend | Timing |
| --- | --- | --- | --- |
| [LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness) | Evaluation infrastructure; a direct way to learn metric integrity | Utility regression tests, data/task loading, cache identity, deterministic scoring fixtures | Weeks 1–2 |
| [DataTrove](https://github.com/huggingface/datatrove) | Composable processing for language-model data | Small data-audit reproductions, streaming/restart tests, filter statistics, provenance examples | Weeks 2–5 |
| [OLMo-core](https://github.com/allenai/OLMo-core) | Building blocks in Ai2’s open training ecosystem | Optional-dependency bugs, tiny checkpoint tests, single-GPU smoke recipes, later distributed fixes | Weeks 5–9 |
| [verl](https://github.com/verl-project/verl) | RL post-training infrastructure | Advantage/masking tests on tiny tensors, rollout bookkeeping, later local integration tests | Weeks 14–21; utility work can start earlier |

Start with **one** primary project and one fallback. These repositories provide concrete technical work and visible issue activity; repository popularity alone does not make a task appropriate. Check contribution guidance, recent merged work, tests, and current maintainer discussion before selecting a patch. The [harness contribution guide](https://github.com/EleutherAI/lm-evaluation-harness/blob/main/docs/CONTRIBUTING.md) is a useful first read.

## Candidate tasks inspected

| Candidate | Observed request/report | Bounded first action | Caveat |
| --- | --- | --- | --- |
| [Harness #4097](https://github.com/EleutherAI/lm-evaluation-harness/issues/4097) | A report about legitimate `None` values being lost when worker outputs are reconstructed | Reproduce with a tiny list fixture; understand expected ordering and padding semantics | Recheck current code and linked patches before changing anything |
| [DataTrove #485](https://github.com/huggingface/datatrove/issues/485) | A request for a compact corpus-audit example | Run a small local audit with rejection outputs and summary counts | Page links related work #500; review that work instead of duplicating it |
| [OLMo-core #850](https://github.com/allenai/OLMo-core/issues/850) | An optional-dependency import problem around a callback | Reproduce in a minimal environment; test import behavior with and without the extra | A dependency fix may need no GPU; maintainer design preferences still matter |
| [verl #7793](https://github.com/verl-project/verl/issues/7793) | A disagreement in singleton-group RLOO advantage behavior | Compare scalar/vectorized paths on hand-computable tensors | Learn RLOO assumptions first; it is distinct from GRPO and undefined leave-one-out cases need explicit handling |

These reports have not been reproduced as part of writing the course. If resolved or already owned, select a current task in the same area. Do not produce speculative patches from an issue title alone.

## First ten study days

1. Day 1: spend one hour reading the harness architecture and contributing guide; run the smallest relevant test subset.
2. Days 2–3: reproduce one candidate locally, identify intended behavior, and write a failing fixture. Limit reconnaissance to 4–6 hours before choosing a better-scoped issue.
3. Days 4–5: prepare a minimal fix or a useful reproduction report, with exact revision, commands, expected/actual output, and tests. This is the first contribution artifact target.
4. Days 6–10: review related discussions, adapt to feedback if available, and prepare a maintainer-ready patch. Submission and acceptance are separate milestones; neither is guaranteed by day ten.

Allocate **six hours/week inside the 52-hour budget**, replacing generic reading/portfolio cleanup and some project implementation time. A relevant upstream patch can satisfy a course deliverable. Do not add six hours on top of an already full week.

Record four separate states: reproduced locally, patch prepared, submitted, merged/adopted. Never count a merge as achieved until it happens. No maintainers were contacted and no issues or PRs were posted while creating this curriculum.

## Low-cost access to larger work

Useful tests and fixes often require only CPU or the GPUs you already own. Contributing to an open project does **not** automatically grant access to its training cluster. After establishing trust, a maintainer may be willing to run a narrowly defined larger test on their infrastructure, but that is discretionary and must not be assumed in the budget.

A strong request for a larger validation run supplies: the exact patch/revision, a local reproducer, the scale-dependent question, estimated device-hours, success/failure criteria, and the artifact you will return. Pursue paid research-engineering collaborations or explicitly offered sponsored experiments as opportunities arise; no specific free-compute award is relied on here.

Default external compute spending is $0. Hardware-specific changes can begin as local tests and pending-scale evidence. Buy a short cloud run only when it resolves a specific blocked question and you have chosen a spending cap.
