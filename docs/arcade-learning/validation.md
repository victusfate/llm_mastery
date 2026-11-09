# Validation record

- `npm run check` passed: TypeScript, 57 passing unit/content tests, Markdown links
  across 157 documents, and the static build. The optional PyTorch execution test
  was skipped as configured; Python starters passed syntax checks.
- `npm run test:browser` passed all eight suites: smoke, reader, learning loop,
  persistence, visuals, visual design, Zero to Hero and Arcade.
- The expanded Arcade browser test completes the original scoring/persistence
  path, visits all 20 episodes, tries all 20 what-if presets, checks live flow
  results, opens definitions and the concept explorer, verifies contextual LLM
  prompts, and checks expanded help at phone width.
- The final miniature comparison charts also passed the Arcade browser test.
- Screenshot review found the sticky HUD obscured long explanations. It is now
  static during episodes so definitions and diagrams have the full viewport.

Local validation used Node 24.22.1; repository CI uses Node 26. Browser checks used
Playwright with headless Chromium. The sandbox blocked browser/server startup and
stalled a Python subprocess; the successful checks ran outside that sandbox.

These checks establish working interactions and regression coverage. Learner
usability and increased learning retention have not been measured.
