# Career optionality after practical expertise

The immediate goal is hands-on mastery of the bootcamp’s training tasks. Career work should support that learning, not consume it. Your fastest plausible entry is research engineering or ML systems work that combines existing engineering depth with demonstrated training skills.

## Evidence from official roles

Checked September 8, 2026. These are snapshots, not an exhaustive market survey or a forecast of what any learner will receive.

| Source | Stated emphasis | Course response |
| --- | --- | --- |
| [OpenAI Research Engineer](https://openai.com/careers/research-engineer-san-francisco/) | Programming, distributed ML systems, high-performance implementations | Correct training code, systems project, profiling |
| [Anthropic Pretraining Scaling](https://job-boards.greenhouse.io/anthropic/jobs/4938432008) | Training reliability, performance, cross-stack debugging, experiments | Data-to-checkpoint pipeline and failure recovery |
| [Anthropic RL Research Engineer](https://job-boards.greenhouse.io/anthropic/jobs/4613568008) | Concurrent programming, RL infrastructure, clean code, systems design | Versioned rollouts and verified policy updates |
| [Google DeepMind roles](https://deepmind.google/careers/) | Research engineers combine implementation and experimentation; research scientists normally have PhDs | Prioritize research engineering; pursue scientific depth through actual studies |

At this check, OpenAI’s page displayed $250K–$445K plus equity; the Anthropic pages displayed annual salary ranges of $350K–$850K for pretraining scaling and $500K–$850K for the listed RL role. These are role/location/level-dependent posted ranges, not typical beginner offers or total-equity valuations. The linked pages are the source; recheck when applying. No estimate of a specific stock award is supported.

## Build a credible evidence package

Keep three strong artifacts easy to inspect: a reproducible pretraining/data study, a systems improvement with correctness and performance evidence, and a post-training study that withstands evaluation scrutiny. Add one specialization result or adopted upstream contribution. Tutorials show learning; external use and independent replication provide additional evidence of value.

Use a claim such as “implemented and profiled DDP across two heterogeneous home nodes; diagnosed network-bound slowdown” when that is what you measured. Do not replace it with “trained frontier LLMs.” Prior C++/simulation and distributed-service experience remains relevant and should be connected to current artifacts.

## Early contribution and interview cadence

Start the [open-source lane](08-open-source.md) in Week 1. From Week 6, use one existing review hour per week for a technical mock: gradients, numerical bugs, data pipelines, training design, or an incident diagnosis. From Week 12, practice a five-minute project explanation that links the problem, intervention, measurement, and limitation.

After the bootcamp, apply selectively to teams whose needs match your best demonstrated skill. An external maintainer’s substantive review can be more useful than another generic certificate. Keep applications and outreach records private. No application or outreach message is sent automatically by this course.

## Interview exercises

- Implement and test stable cross-entropy or causal attention under a time limit.
- Explain an OOM using a parameter/activation/optimizer memory ledger.
- Design data curation under a fixed token budget and defend the evaluation split.
- Diagnose training instability or a distributed straggler from logs.
- Derive a policy-gradient estimator and distinguish old/current/reference policies.
- Defend a null result and describe the next experiment that would change your mind.

An exceptional offer generally requires unusually valuable demonstrated work and a team that needs it; there is no validated course-duration shortcut. Treat visibility, collaborations, and recruiting as parallel opportunities, with technical competence as the foundation.
