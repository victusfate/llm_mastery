# Arcade learning rabbit holes

## Problem and requirements

The Arcade became the default route but omitted the workbench's concept explorer,
visual definitions and tutor handoffs. Learners met controls and unfamiliar terms
before they had enough context to act. The requested experience keeps the small
projects while making learning an interactive, enjoyable rabbit hole.

Every episode must offer plain definitions, an inspectable data flow, a worked
example, a hint, a misconception, an immediate what-if experiment and a contextual
LLM handoff. No account, API key or paid model is required. Preserve stored progress
and scoring, and keep the full lesson and primary sources reachable.

## Implementation slices

1. Author episode-specific explanations and contrasting experiments for all 20
   episodes in `src/site/episode-learning.ts`.
2. Mount a persistent guide below the exercise with expandable definitions and
   examples. Three keyboard-accessible flow buttons expose current inputs, the
   transformation and actual scene results. Presets show starting/current results
   and an explanation without awarding challenge XP. Reset restores starting values.
3. Reuse the workbench's concept explorer, visual primer, related concepts and tutor
   interface. Deeper lessons open separately to preserve the current attempt.
   Tutor prompts include live settings, readouts and the current exercise.
4. Add catalogue and browser checks for coverage, valid presets, immediate feedback,
   prompt context, unchanged settings after concept exploration and mobile layout.

## Boundaries

The interactive examples illustrate mechanisms rather than running actual training.
Each guide names relevant assumptions, including independent sampling for pass@k,
fixed noise for the seed example and model-state memory estimates. The PPO panel
illustrates a clipped ratio, not the full signed surrogate or a hard policy bound.
Opening help is encouraged and does not change XP. Guided presets do not solve a
challenge automatically. Existing hint/assessment rules remain in place.

## Validation

See validation.md for commands and observed results from this change.
