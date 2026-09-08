# Initial release validation

Date: September 8, 2026.

## Completed checks

- Six Node test groups passed: softmax numerical properties, answer grading, review scheduling, all twenty question families, backup validation, and escaped Markdown rendering.
- Two Python test groups passed: allowed public assets and rejected private/traversal paths.
- The Markdown checker found no missing local file links or unmatched fenced code blocks.
- A Chromium browser smoke test passed through all ten module guides, all four visual experiments, incorrect/correct/assisted answers, persistence after reload, backup export/import, invalid-backup rejection, the review queue, and private-path rejection.
- A 390-pixel mobile viewport had no horizontal page overflow. A desktop screenshot was visually inspected.

Validation used Python 3.14.4, Node 24.18.0, and Playwright 1.63.0 with its Chromium build. The application requires no JavaScript package installation to run; Playwright is optional test tooling. See [the workbench guide](10-interactive.md) for reproducible commands.

## Explicit limits

No learner training labs, GPU compatibility checks, multi-node runs, upstream issue reproductions, or research experiments have been performed by writing this course. No practical mastery has been awarded. Live video playback and speech quality depend on external providers and the browser/OS; their availability was not established by the automated smoke test.

The official source pages linked from the course were inspected for curriculum and contribution planning, but the repository checker validates local Markdown links only. External issue state can change. The résumé was retrieved successfully with a direct HTTP client; Void Horizon returned HTTP 403 and was not inspected. The scaffold README was reviewed as background; its files were not imported.

These initial checks were performed before remote publication. No upstream maintainers were contacted during course creation.

## Interactive course expansion — September 8, 2026

Validated 128 Markdown documents for local links and closed code fences. Ten Node test groups and two Python tests passed. Browser checks covered all ten module guides, four original numerical widgets, grading and assistance, progress import/export, mobile overflow, formatted Markdown redirect and tables, concept dialog, referenced video iframe creation, actual narrated audio playback, dedicated lab rendering, and HTTP availability of all 52 lab and 35 submodule documents. External video playback remains provider-dependent.

The foundations NumPy walkthrough ran successfully: loss 0.490415, finite-difference gradient checks passed, and one update reduced loss to 0.474975. This validates the small worked example, not learner mastery or frontier-scale training.

## TypeScript and adaptive learning update

Interactive source now lives in `src/site`, with a TypeScript build and localhost preview. Thirteen Node test groups, TypeScript checks, public Markdown link checks, and all three browser suites pass. New browser coverage includes definition-first navigation, specific visual examples, deeper references, preferred-tutor handoff, confidence feedback and storage, next-step recommendations, actual playback of all three Kokoro samples, and mobile submodule layout.

The old Python preview/link-check scripts and their preview-specific tests have been replaced by TypeScript tooling and browser checks. Python remains available for numerical learning examples. Tutor-model answer quality has not been evaluated: the shipped integration copies context to the learner's selected interface and does not perform inference or award model-generated grades.
