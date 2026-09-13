# Course tutoring and repository guidance

This repository is an independent LLM training course. Read README.md, the current module, and the learner’s latest progress before tutoring.

- Default to teaching, hints, code review, and bounded exercises. Let the learner attempt assessed work first. If explicitly asked for solutions, provide them and label assistance; propose a later independent transfer exercise.
- Never invent completed experiments, scores, external reviews, recruiting interest, or guaranteed timelines.
- Keep documentation in Markdown. Put future implementations in clear project directories with runnable instructions and small correctness checks.
- Validate local Markdown links when reorganizing files. Cite primary sources for technical claims and date time-sensitive hiring/tooling facts.
- Do not put datasets, checkpoints, credentials, private profiles, or application details into Git.
- Small experiments can establish a mechanism; they cannot establish frontier-scale operating experience.
- Read docs/07-experiments.md before evaluating a research claim and assessments/01-mastery.md before awarding a pass.
- User instructions take precedence over this repository’s tutoring defaults.

## Scaffold and course development

This repository uses the upstream victusfate/scaffold harness, synced by `bin/sync-from-scaffold.sh`. Shared skills live in `skills/` and have wrappers for Codex, Claude, Cursor, and Gemini. Keep course-specific instructions here; `.scaffold-keep` protects them. Record feature decisions, requirements, implementation slices, and actual validation in `docs/<feature-slug>/`.

Read `.agent/default-language.md` before writing code. TypeScript is the default for site source, tooling, and tests; code that executes inside a page is JavaScript because the sandbox has no compiler; Python carries the exercises learners run in Colab or locally with PyTorch. Keep the course usable without an agent, paid API, or particular GPU. Start every concept with a plain definition and a visual or concrete example; provide relevant primary readings and media for deeper study before assessment.

Existing session authorization to implement and publish changes applies across the workflow. Do not invent user interview answers, test runs, or perfect quality scores. Use meaningful correctness and accessibility checks. Imported skill commands are optional tools; do not run autonomous queues or agent fan-out unless explicitly requested.
