# Default language: TypeScript

Use TypeScript (.ts) for interactive pages, application code, tests, and new site tooling. Browser code compiles to JavaScript; Node 24 runs tooling with native type stripping.

Three languages appear in this repository, each for a reason:

| Where | Language | Why |
| --- | --- | --- |
| Site source, tooling, tests | **TypeScript** | The default. Type-checked by `npm run typecheck` and bundled by `npm run build`. |
| Code that runs inside a page — the live cells fenced as ```run` | **JavaScript** | The sandbox worker executes the learner's text directly, with no compile step, so what they type is what runs. Shipping a transpiler to the browser for a fifteen-line teaching snippet is not worth the megabytes or the offline cost. The API those cells call is TypeScript and fully typed. |
| Exercises learners run in Colab or on their own machine | **Python** | PyTorch, Triton, FSDP, TRL and the evaluation harness have no TypeScript equivalent, and Python is what language-model training work is actually done in. Guides pair each JavaScript cell with a PyTorch starting point. |

Do not add a fourth without a reason recorded in the relevant `docs/<feature-slug>/design.md`. Preserve upstream Scaffold runtime files in their original formats when syncing; this is vendored tooling, not a change to the course language default.
