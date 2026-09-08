# Module 10: capstone, external review, and continued growth

Full route: Weeks 33–40, 416 hours. Bootcamp: Weeks 22–24, 156 hours. Dependencies: prior project evidence. The bootcamp capstone improves an existing baseline; the longer route permits a broader original study.

## Outcome

A result another researcher can inspect and reproduce, with a clear account of what you learned and what remains uncertain. Novelty is desirable; rigorous negative results and useful infrastructure can also pass.

## Select one question

| Direction | Bounded question | Main comparison |
| --- | --- | --- |
| Data | Does deduplication improve held-out performance under a fixed small token budget? | Group-aware split and duplicate-rate sweep |
| Systems | Which bottleneck limits training across two heterogeneous home GPUs? | Single-device versus two-node DDP, measured network costs |
| RL | Does a changed advantage reduction alter reward/length behavior? | Same initial policy, tasks, samples, seeds, evaluation budget |
| Evaluation | Does a cache or parsing defect alter reported model rankings? | Minimal reproducer, corrected implementation, regression checks |

Connect the choice to an upstream project from the [contribution plan](../docs/08-open-source.md). Check prior work before calling it novel. An upstream fix and the associated experimental report can constitute the capstone; avoid duplicating effort just to create another repository.

## Execution

1. State a falsifiable hypothesis, baseline, intervention, primary metric, compute ceiling, and failure/stop criteria before running.
2. Reproduce the baseline. If it fails, narrow the question and document the reproduction discrepancy.
3. Run controlled ablations and repeat small configurations across seeds. Add one transfer setting if time allows; otherwise state the limit.
4. Ask a human reviewer or maintainer for feedback through a channel you choose to use. Incorporate substantive critique. The tutor can draft material; it should not contact people without your instruction.
5. Publish a concise report with exact commands, pinned revisions, data retrieval details, raw metric tables, and limitations. Separate unrun design proposals from measured results.
6. Give a 20-minute technical talk and defend implementation details without the tutor. Complete the final practical assessment.

Three-week bootcamp allocation: Week 22 question/baseline; Week 23 intervention/replication; Week 24 review, reproducibility, and defense. The upstream contribution lane starts in Week 1, so the capstone is not your first outside interaction.

## Gate

A fresh environment reproduces a representative result within a justified tolerance. You can defend the mathematical and engineering choices and name evidence that would overturn the claim. External review can remain pending, but must not be represented as completed.

## Optional 8–16 week extension

Deepen one specialization, seek a maintained component to own, reproduce at a second scale or setting, and collaborate on a study that needs resources beyond the home lab. Use reviewer feedback to choose the work. Apply to suitable roles when evidence is strong enough; see the [career guide](../docs/05-career.md). Do not automatically turn every learner into a publication-seeking researcher.
