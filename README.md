# LLM Training Mastery

An intensive, project-based course for learning to build, train, evaluate, and improve language models at home, with an AI tutor and human review.

**Target:** gain hands-on deep-learning training expertise, centered on language models, with a possible later path into LLM research engineering. The course is designed to produce inspectable evidence of ability: working implementations, controlled experiments, reproducible reports, and contributions other researchers can use.

**Primary path: a [24-week hands-on bootcamp](docs/00-personalized-bootcamp.md)** for experienced engineers, focused on data curation, pretraining, distributed training, RL, and alignment. Plan 1,248 coursework hours plus four reserve weeks. An 18–20 week path is conditional on strong diagnostic performance; the [40-week route](docs/02-curriculum.md) provides more preparation. These are planning estimates, not mastery or hiring guarantees. See the [timeline assumptions](docs/01-timeline.md).

## Open the interactive workbench

Open the [hosted course](https://victusfate.github.io/llm_mastery/), or clone the public repository and start the local workbench:

```bash
git clone https://github.com/victusfate/llm_mastery.git
cd llm_mastery
python3 scripts/serve.py
```

Visit **http://127.0.0.1:8765/site/** for 35 narrated submodules, 52 dedicated lab guides, formatted readings, concept popups, interactive numerical experiments, randomized theory checks, scheduled review, and hands-on tutor handoffs. No API key or cloud spend required. [Workbench guide](docs/10-interactive.md).

## Start here

1. Read the [starting instructions](START_HERE.md).
2. Complete the [placement diagnostic](assessments/00-placement.md) before choosing a route.
3. Follow the [24-week bootcamp](docs/00-personalized-bootcamp.md), or the [fuller curriculum](docs/02-curriculum.md), using the linked module guides.
4. Use the [tutoring protocol](docs/03-working-together.md) at each session.
5. Track evidence using the [mastery rubric](assessments/01-mastery.md) and [progress tracker](progress/README.md).

## What you will build

| Artifact | Demonstrates |
| --- | --- |
| A language model training stack built from basic tensor operations | Autograd, tokenization, decoder architecture, numerical correctness |
| A reproducible pretraining study | Data quality, optimization, checkpointing, scaling, evaluation |
| A measured systems improvement | Profiling, kernels, distributed training, performance tradeoffs |
| A post-training comparison | SFT, preference learning, PPO, verifiable-reward RL, robust evaluation |
| An original specialization study and an external contribution | Research judgment, ownership, collaboration, technical communication |

The initial release includes a working learning interface, course instructions, and assignment specifications. Learners implement training code during the course; no training experiment results or learner achievements are claimed yet. This is an independent curriculum, not an accredited program or an affiliation with any linked institution.

## Course map

| Guide | Purpose |
| --- | --- |
| [24-week bootcamp](docs/00-personalized-bootcamp.md) | Primary experienced-engineer route |
| [Interactive workbench](docs/10-interactive.md) | Lessons, visuals, quizzes, learning records |
| [Home hardware](docs/09-home-lab.md) | Local 5090/5080 plan and two-node limits |
| [Open-source lane](docs/08-open-source.md) | Current contribution candidates and first-ten-day plan |
| [Timeline](docs/01-timeline.md) | Prerequisites, minimum plausible routes, hours, reforecasting |
| [Curriculum](docs/02-curriculum.md) | Every week, deliverables, module dependencies |
| [Working together](docs/03-working-together.md) | Tutor prompts, independent work, review cadence |
| [Compute and setup](docs/04-compute.md) | CPU fallback, GPU tiers, cost accounting, environment setup |
| [Portfolio projects](projects/README.md) | Experiments and acceptance criteria |
| [Hiring strategy](docs/05-career.md) | Job evidence, interviews, visibility, exceptional-offer limits |
| [Reading library](docs/06-resources.md) | Primary papers and official implementation references |
| [Experiment standards](docs/07-experiments.md) | Fair comparisons, leakage controls, reproducibility |
| [Prerequisite bridge](modules/00-bridge.md) | Extra preparation when the diagnostic reveals gaps |
| [Contributing](CONTRIBUTING.md) | How others can use and improve this public course |

**Schedule:** a 12-hour daily window on five days, containing 9 hours of coursework and 3 hours for meals, exercise, and breaks; 7 coursework hours Saturday; Sunday off. That is 52 coursework hours per week, not 84 effective learning hours. Adapt to sustained performance rather than chasing logged hours.

**Compute:** the primary [home-lab plan](docs/09-home-lab.md) uses existing RTX 5090/5080 PCs and a MacBook Pro, targeting $0 required cloud spend. Generic CPU and rental alternatives are in the [compute guide](docs/04-compute.md).

**Contribute immediately:** the [open-source lane](docs/08-open-source.md) targets a small reproduction in Week 1 and a reviewable patch within two weeks, beginning with LM Evaluation Harness or DataTrove. Acceptance remains up to maintainers.

**Sources checked:** September 8, 2026. The roadmap combines original assignments with selected primary references. Hiring requirements and software APIs change; refresh them at the scheduled checkpoints. Original repository material uses the [MIT license](LICENSE.md); external materials retain their own terms.
