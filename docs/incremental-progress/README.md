# Incremental chunk tracking

Feature decisions, requirements, and validation for the small tracked chunks
introduced alongside the palette refresh.

## Requirement

Visitors should be able to complete small, self-contained chunks with a
visible feeling of progress and knowledge gain, instead of facing a whole
module at once.

## Design decisions

- Each module decomposes into chunks derived from existing content, not a
  parallel curriculum: one overview chunk, one chunk per submodule page, one
  chunk per lab, and one "pass one check unaided" chunk. The list lives in
  `src/site/steps.ts` (`moduleSteps`), derived from `submodules.ts` and
  `labs.ts` so it cannot drift from the course content.
- Completion is stored in `localStorage` under `llm-training-steps-v1` as
  `"<module>-<step id>" -> completion timestamp`, separate from the quiz
  scheduling state so a corrupt import of one cannot corrupt the other.
  Loads are sanitized (`sanitizeSteps`) rather than trusted.
- The unaided-correct quiz handler banks the module's "prove" chunk
  automatically; everything else is marked by the visitor, on the module
  sidebar or via a "Mark complete" button on each submodule and lab page.
- Progress is shown three ways: a progress bar and checklist for the selected
  module, a `done/total` counter (or ✓) on every module button, and a
  `chunks done` figure in the sidebar stats.
- Chunk completion is a pacing and momentum aid. The interface copy states it
  is not a grade; practical gates remain governed by
  [the mastery rubric](../assessments/01-mastery.md).
- The steps record is included in progress backups via
  `isLearningDataKey`, so export/import moves chunks between machines.

## Palette refresh

The previous dark-olive/lime/gold palette read as muddy. It was replaced with
a calm slate background and a single soft-blue accent with a muted violet
secondary (`--accent`, `--accent-2` in `site/style.css`). The mechanism
diagrams in `src/site/graphics.ts` were moved to the same family so SVG
plates match the page, and the missing-stylesheet fallback color assertion in
`tests/visual-design.browser.ts` was updated to the new text color.

## Validation actually run

- `npm run check` (typecheck, unit tests including `tests/steps.test.ts`,
  Markdown link check, production build) — pass.
- `npm run test:browser` with Playwright chromium — all six suites pass.
  The visual-design suite measured minimum text contrast 8.29:1 and graphics
  contrast 3.47:1 at 1280/390/320 px with the new palette, above its 4.5:1
  and 3:1 gates.