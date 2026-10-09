# Zero to Hero companion track — design record

## Requirement

Integrate Andrej Karpathy's public "Neural Networks: Zero to Hero" lecture series into this course: link the videos, dial the material into our modules, and make the study heavily visual with interactive coding samples. Respect the licenses of everything referenced, and keep our own contribution MIT licensed.

## Decisions

**1. A companion track, not a rewrite of the modules.** The nine lectures are cross-cutting: lectures 1 to 6 serve module 1, lectures 7 and 8 serve module 2, and lecture 9 previews modules 3 to 5. Folding them into the existing module/submodule numbering would have forced a fake linear position and disturbed the 35 submodules and 52 labs that assessments already reference. Instead the track is its own page and its own document set, linked from both directions: each lecture names the modules and labs that assess it, and modules 1 and 2 name the lectures that build their machinery.

**2. Link videos, never reproduce them.** No transcripts, subtitles, screenshots, or pasted notebook cells. The video embed is opt-in (a button, then a `youtube-nocookie` iframe) so the page makes no third-party request until a learner asks for one. Every mechanism the study needs is re-implemented by us from published descriptions and primary papers. [Licensing notes](licensing.md) record each work's status and the date checked.

**3. Our own numerics, so the panels compute rather than illustrate.** `src/site/z2h-numerics.ts` implements, from scratch and deterministically: expression parsing with reverse-mode autograd and a finite-difference comparison; a bigram counting model with smoothing, loss, and sampling; a character MLP that trains in a browser tab; initialisation diagnostics with activation histograms, saturation fractions, per-layer gradient statistics, and optional batch normalisation; a hand-derived gradient check with three deliberately broken backward rules; hierarchical versus flat parameter scaling; one causal attention head with a causal-invariance measurement; byte-level BPE training, encoding, decoding, and token pieces; and GPT-2 parameter, compute, cost, and learning-rate-schedule accounting.

Determinism was a requirement, not a convenience: the same seeded generator runs in the tests and in the browser, so a number in a lesson can be asserted in CI.

The lecture-1 engine exists in two forms on purpose. The typed-expression parser suits a panel where a learner types a formula and drags its inputs. The exercise itself is composed rather than parsed, so there is also a `Value` class with method-chained operations (JavaScript has no operator overloading), a `Neuron`/`Layer`/`Network` hierarchy with `parameters()`, a finite-difference helper, and a four-example training loop with an option to skip gradient clearing so the classic bug can be demonstrated rather than described. Both forms share the trace figure, and a test asserts they agree to `1e-12` on the same formula.

**4. Visualisation reuses the existing diagram system.** `z2h-visuals.ts` builds on the primitives and palette in `graphics.ts` (now exported rather than duplicated), so new figures inherit offline-safe inline styles, a title and description for screen readers, a scrollable container, and the contrast and font rules the visual-design checks enforce. New figure types: computation-graph trace, labelled matrix heatmap with optional causal mask, embedding scatter, activation histogram with saturation bands, multi-series line plot with a logarithmic option, hierarchical context tree, and a token ribbon. Exact numbers live in adjacent HTML tables rather than crowding an SVG with unreadable text.

**5. Interactive coding samples run in a Web Worker.** The alternative — evaluating learner-edited code on the main thread — cannot survive an infinite loop, which a learning environment invites. `z2h-worker.ts` receives the snippet, runs it with the numerics, the sample datasets, and a `print` function injected, and returns printed lines plus a preview of the returned value. The page enforces a five-second timeout by terminating the worker. The sandbox has no page access, no storage, and no network; results are previewed with array and depth truncation so a large return cannot lock the page. A returned numeric matrix is drawn as a heatmap, which makes "edit the code, see the picture change" a one-step loop.

**5b. Runnable code lives beside the paragraph that explains it.** A separate sandbox at the foot of the page asks a learner to hold an explanation in their head while scrolling to try it. Instead, a guide fences a block as ```run` and `upgradeLiveBlocks` turns it into an editable cell in place, sharing the worker, the timeout, and the matrix rendering with the lecture's full sample, which is now just the last cell on the page. The fence marker is the only convention, so the Markdown remains readable wherever it is not being upgraded — on GitHub, in a diff, in the reader — and a browser that refuses to start a worker degrades to a plain code block. A test executes every fenced block in every guide, so a broken inline example fails CI rather than the lesson.

**5c. JavaScript in the page, Python for the real exercise.** The sandbox executes learner text through `new Function`, so a type annotation would be a runtime syntax error: in-page cells are JavaScript, and the alternatives were rejected on cost — shipping a transpiler is megabytes for a fifteen-line snippet, and stripping types at build would mean the file a learner reads differs from the text that runs. The exercises themselves are PyTorch, which has no TypeScript path and is what the work is done in, so every guide pairs its JavaScript cells with a Python starting point for Colab or a local notebook. The repository's language policy records all three roles in `.agent/default-language.md`.

**6. Panels declare controls; render functions stay pure.** `z2h-widgets.ts` holds one widget per lecture as a control specification plus a pure `render(values)` returning figures, a readout, and a note. Expensive panels (the MLP trainer) redraw on an explicit button rather than on every slider movement. This keeps every panel testable without a browser and makes the interactive text reproducible.

**7. Notes join the existing progress system.** Track notes use `llm-training-zero-to-hero-<id>` keys, accepted by `isLearningDataKey`, so they are included in progress exports and restores like lab and submodule notes. Edited code persists in `sessionStorage` only: it is scratch work, not evidence.

## What was deliberately not done

- **No new audio narration.** The existing submodules carry narration; recording nine more would add maintenance without adding understanding, and the lectures themselves are the audio-visual material here.
- **No Python execution in the browser.** A Python runtime would add a large dependency and contradict the course's no-install promise. The implementation work happens in the learner's own environment, which is where it belongs; the browser panels exist to probe mechanisms and check intuitions.
- **No claim of completion as evidence.** The track is not in the mastery rubric. Watching nine lectures is not an achievement the course recognises; the labs, the checks, and an independent transfer task are.
- **No invented runtimes or dates.** Lecture runtimes are not listed, because we could not read them from a primary source in this environment; the guides point at the playlist instead. Video identifiers and repository links were read from the upstream repositories and carry the date they were checked.

## Verification

See [validation.md](validation.md) for the commands run and their actual output, including what could not be run in this environment.
