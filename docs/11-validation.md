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
