# Contributing and public use

Fork the course, complete the diagnostic, and keep your own progress records. Open an issue for a confusing instruction, broken reference, proposed lab, or reproducibility problem. Describe the reader’s starting point and the smallest concrete improvement.

For a contribution, include the problem, changed behavior, relevant primary references, and validation. Technical labs need a CPU smoke path where feasible, estimated compute, deterministic small checks, and an explicit completion criterion. Reports must distinguish measured results from forecasts and mark AI assistance.

Original course text and future original contributions use the [MIT license](LICENSE.md). Linked papers, datasets, code, and model weights retain their own terms. Link to third-party assignments and solutions rather than copying them into this repository. Keep assessment questions separate from worked solutions, and label any solution clearly so learners can attempt the exercise first.

## Before publishing a fork or the initial repository

- Review every staged file for personal information and credentials.
- Keep raw data, model weights, and large logs outside Git; publish compact metrics, manifests, and retrieval instructions when appropriate.
- State exactly what ran, on what hardware, and with what assistance.
- Check local links and verify that each run command points to code that exists.
- Attribute borrowed ideas and preserve third-party notices.

The initial repository contains Markdown course material and a working browser learning interface; training-project commands and results will be added as learners implement the labs. A local Git repository can be prepared before choosing a hosting account. Publishing to a remote is a separate action; no hosted repository is implied by these files.

## Issue template

```markdown
# Problem
Affected file and section:
What I tried:
Expected learning outcome:
Observed issue:
Proposed improvement:
Evidence or primary source:
Compute/access implications:
```
