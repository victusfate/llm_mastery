# Working with your tutor

The learner owns the understanding and the evidence. The tutor teaches, asks questions, reviews experiments, and helps diagnose failures. It can be wrong; verify numerical claims against calculations, tests, and primary references.

## Interactive and agent-assisted work

Start with the [browser workbench](10-interactive.md) for a concise lesson, prediction, and numerical challenge. This course accepts agent-assisted implementation as an important engineering skill. Separate two assessments: can you direct and verify an implementation, and can you independently explain/debug its core mechanism? Use small closed-reference transfer tasks for the latter.

## Session loop

1. Open the current module and latest learning log. State one observable outcome for today.
2. Spend 15 minutes recalling yesterday’s concepts without notes.
3. Ask for a concise explanation of the first missing concept, then predict an outcome before coding.
4. Attempt the exercise independently for 45–90 minutes. Ask for progressively stronger hints when stuck.
5. Bring code, exact commands, shapes, seed, environment, expected behavior, and observed behavior to review.
6. Diagnose with the smallest experiment that can distinguish competing explanations.
7. Close with a five-minute explanation from memory, evidence paths, and the next task.

Use AI freely for unassessed tooling and comprehension, but label assisted implementations. For a mastery gate, work without AI or reference implementations, then request review. If you ask for a full solution, the tutor may provide it; schedule an independent transfer exercise afterward. Never claim assisted work was unaided.

## Useful prompts

**Teach:** “Explain [concept] using tensor shapes and one numerical example. Give me a prediction question before showing the result.”

**Hint:** “Here is my attempt and failing check. Give the smallest useful hint, then let me repair it.”

**Debug:** “List three plausible causes ranked by evidence. For each, propose a cheap discriminating test. Avoid changing several variables together.”

**Paper:** “Use this primary paper. Separate its measured claims, assumptions, and our speculation. Help me design a smaller experiment testing one mechanism.”

**Review:** “Review this experiment against docs/07-experiments.md. Find leakage, incorrect denominators, unfair compute comparisons, and unsupported conclusions.”

**Assessment:** “Give me a fresh variant of this module’s gate. Keep solutions out of the question. After my attempt, score each rubric dimension using evidence.”

**Interview:** “Run a 45-minute research-engineer interview on [topic]. Ask one question at a time. Score my independent reasoning and recovery from mistakes.”

**Resume next session:** “Read my latest log and tracker. Summarize the last verified result and the next unresolved question, then continue the exercise.”

## Weekly review: Saturday

Allocate 2 hours to a fresh coding/derivation challenge, 1 hour to an oral defense, 2 hours to experiment analysis and report cleanup, 1 hour to targeted repair, and 1 hour to next-week planning. These seven hours are part of the weekly budget.

Record which work was independent, hinted, paired, or generated. The tutor may propose a score; only observed artifacts support a pass. Seek human review at Weeks 10, 18, 28, and 40. If no reviewer is available, mark external validation pending and continue the next independent task.

## Durable records

Keep course instructions and reusable reports public. Keep identity, private applications, personal schedule details, credentials, and sensitive data under `private/` or outside the repository. Use the [templates](../templates/README.md). A new tutor session should be able to resume from a short log without needing an entire chat history.

Every four weeks, reread one old module, reproduce a small result, and explain a concept from it without notes. Fold this into existing review hours.
