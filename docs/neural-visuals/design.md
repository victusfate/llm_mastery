# Neural networks and graphical course visuals

## Decision and requirements

Replace text-only visual examples with local SVG illustrations throughout all 71 concept entries, the concept dialog, definition cards, and all 11 sandbox types. Preserve explanations and numerical controls. Use connected neurons, computation paths, matrices, token embeddings, probability bars, document stacks, worker state, policy branches, and parameter trajectories. Shared illustrations establish a mechanism; the adjacent concept-specific sequence explains the application. Illustrative values are not experiment results.

## Implementation

- SVG primitives and mechanism renderers live in `src/site/graphics.ts`.
- Every concept has an explicit graphic assignment. Unknown assignments fail visibly during content validation.
- Interactive graphics derive from the same slider values as the numeric readouts.
- SVG titles, descriptions, labels, shapes, and supporting prose provide alternatives to color. Graphics resize without external assets, animation, or network access.
- Large hidden layers show up to eight neurons with an explicit truncation label.

## Validation

- `npm run check`: TypeScript, 15 course/engine tests, 139 Markdown documents, and static build passed.
- `npm run test:browser` with an external Playwright installation: existing smoke, reading, learning-loop, and persistence checks passed.
- `tests/visuals.browser.ts`: all 11 sandbox types rendered SVG with accessible names, remained finite at slider extremes, and fit a 390px viewport. Added to the browser suite.
- Inspected a rendered desktop network/computation graph screenshot; mobile screenshots were also captured outside Git.
- Concept coverage checks require SVG shapes and descriptions for all 71 entries.
