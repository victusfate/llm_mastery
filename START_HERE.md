# Start here

Start with [Choose your learning route](docs/15-learning-paths.md). The course supports developers new to ML, practitioners filling specific gaps, and experienced engineers pursuing an intensive route.

Begin with the definitions and visual examples in the first lesson. Explore at your pace, then use the placement diagnostic to identify which implementation skills need practice.

## Open the learning interface

Install Node 24+, run `npm install`, then `npm run dev` from this directory and open http://127.0.0.1:8765/site/. Use Learn & explore for explanations, Retrieve & test for theory, and Build & defend for evidence to review with the tutor. The app’s quiz scores do not replace the placement implementation tasks.

## Build the mechanics alongside the modules

The [Zero to Hero companion track](docs/18-zero-to-hero.md) pairs Andrej Karpathy's free lecture series with our own study plans, interactive panels, runnable samples, and correctness checks. It is the fastest route to being able to write an autograd engine, a tokenizer, and a transformer yourself, and it runs alongside modules 1 and 2 rather than before them. Watching is not assessed; the labs are.

## Optional intensive first day: nine coursework hours

| Time budget | Task | Save |
| --- | --- | --- |
| 30 minutes | Record background, target role, hardware, monthly compute ceiling, and schedule | A personal copy of the learner profile below |
| 4 hours | Attempt the placement diagnostic without AI or solutions | Answers, code, and actual elapsed time |
| 1 hour | Review the attempts with the tutor; distinguish independent from assisted answers | Scores with evidence |
| 1 hour | Choose the route and inspect the first module | A provisional schedule |
| 90 minutes | Set up a small Python environment; run a tensor gradient and save its output | Environment note |
| 1 hour | Repair one diagnostic weakness and explain it from memory | A short learning log |

Use [placement](assessments/00-placement.md), [setup](docs/04-compute.md), and [foundations](modules/01-foundations.md). If tools are unfamiliar, start the [bridge](modules/00-bridge.md); an incomplete diagnostic is useful information.

## Learner profile

Copy this into `private/profile.md` (ignored by Git) if it includes personal details. Public learners can keep an anonymized version in their own progress directory.

```markdown
# Learner profile
Start date:
Python/software engineering experience and examples:
Math background: linear algebra / calculus / probability:
Deep-learning projects completed independently:
Distributed systems, Linux, and GPU experience:
Target: pretraining systems / RL research engineering / undecided:
Weekly availability and planned time off:
Hardware: OS, RAM, accelerator, VRAM, storage:
Monthly compute ceiling and total course ceiling:
Constraints affecting applications (keep private):
Placement results, assistance used, and evidence paths:
Selected route and next reassessment date:
```

## First message to your tutor

> We are starting LLM Training Mastery. Read the README, my placement attempt, and the tutoring protocol. Grade only demonstrated skills, ask me to explain any ambiguous answers, and select the shortest route I can support with evidence. Then teach the next missing concept and assign one bounded exercise. Do not complete my assessed exercise unless I explicitly ask for a worked solution.

## First-week completion

By Saturday, produce a stable softmax/cross-entropy implementation, a numerical gradient check, and a short explanation of data leakage. Use the remaining Week 1 hours to work through Module 1; the day-one diagnostic is included in its allocation. Reattempt one task in a fresh setting before marking a skill passed.

The progress tracker starts empty on purpose. A readable explanation or AI-generated solution is not evidence that you can perform the task independently.
