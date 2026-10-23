# LLM Arcade: bite-sized episodes

**Status:** implemented October 23, 2026. Page: `site/play.html`. Source: `src/site/game.ts`, `src/site/episodes.ts`, `src/site/play-page.ts`, `site/arcade.css`.

## Problem

The workbench is thorough, but long module pages and lists of terms lose attention. The learner asked for short, game-like episodes that show progress and validate new knowledge through live interaction, and noted that animation helps understanding.

## Decisions

| Decision | Why |
| --- | --- |
| One idea per episode, play before explanation | Lists of terms caused people to tune out. Touching a live control first gives the definition something to attach to. |
| Five fixed steps: Play → Idea → Check → Calculate → Reward | Predictable rhythm, around five minutes, visible progress dots. |
| Copy limits enforced by tests | Idea ≤ 170 characters and ≤ 3 sentences, hook ≤ 60, options ≤ 40. Episodes cannot quietly grow back into walls of text. |
| Scenes update DOM in place with CSS transitions | Bars grow and token cells fade as a control moves, so cause and effect are visible as motion. |
| "▶ Watch it move" sweeps one control across its range | Shows the whole response curve without the learner hunting for it. The sweep never counts as solving the challenge. The Idea card replays it automatically. |
| XP = sum of each episode's best score (max 90) | Replays cannot farm points; only a better run raises the total. |
| Numerical checks reuse `makeQuestion(module, variant)` | Fresh numbers each attempt. Answers also update the workbench's spaced-review schedule, and an unaided correct answer banks that module's "Pass one check unaided" step, as in the Retrieve tab. |
| Separate storage key `llm-training-arcade-v1`, included in backups | Arcade state cannot corrupt the main progress record; export/import still moves it. |
| Root `index.html` opens the arcade | New visitors start with the low-friction entry point. The workbench stays one click away and keeps its URL. |

## Scoring

| Event | XP |
| --- | --- |
| Live challenge solved | 30 |
| Check right on the first try, unaided | 20 each |
| Check right after a miss or a hint | 5 each |
| Episode finished | 20 |

Stars: 1 for finishing, 2 at ≥ 70, 3 at 90. Levels run from *Random init* to *Reasoning* across 1,800 XP. Badges cover a first episode, a three-star run, a cleared season, a three-day streak, ten episodes, and the full series.

## Honesty limits

Arcade XP measures practice with small, exact examples. It is not a module pass and is labelled as such on the page. Practical gates still need labs, evidence, and review ([mastery rubric](../../assessments/01-mastery.md)). Example prices and budgets inside challenges are illustrations, not quotes.

## Validation run

- `npm run check`: typecheck, unit tests (including `tests/game.test.ts` and `tests/episodes.test.ts`), Markdown links, static build.
- `tests/episodes.test.ts` enumerates every reachable control setting of all 20 challenges. Each starts unsolved, has at least one solution, and renders finite values.
- `tests/play.browser.ts` plays episode 1 end to end. It covers the sweep not solving, in-place scene updates, three stars, storage, the shared review record, no XP gain on reload, deep links to all 20 episodes, and no horizontal scroll at 375px.
- The existing browser suites (`npm run test:browser`) still pass.

Not yet done: a learner usability session. Episode timing (about five minutes) is a design target, not a measurement.
