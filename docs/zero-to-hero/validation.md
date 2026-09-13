# Zero to Hero track — validation

Recorded September 12, 2026, on Node v22.22.2 in a Linux container. The repository targets Node 24; nothing here depended on a version-specific feature, but re-run `npm run check` on Node 24 before release.

## Commands run and their result

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | Passed with no output. One real defect was caught and fixed: the track page reused the element id `lecture-status`, which already belonged to the module lecture player |
| `node --test tests/engine.test.ts tests/content.test.ts tests/zero-to-hero.test.ts` | 36 tests passed, 0 failed (15 pre-existing, 21 new) |
| `node scripts/check-docs.ts` | Checked every public Markdown document; all local links resolve |
| `npm run build` | Static course built into `dist/`, including `site/zero-to-hero.html` and the bundled `z2h-*.mjs` modules and worker |
| `node tests/zero-to-hero.browser.ts` | Passed: 9 lecture pages, slider extremes, inline and sample cells, cell isolation, timeout recovery, edit persistence, notes, mobile layout |
| `node tests/browser-smoke.ts`, `reader-browser.ts`, `learning-loop.browser.ts`, `persistence.browser.ts`, `visuals.browser.ts` | All passed, unchanged by this work |
| `node tests/visual-design.browser.ts` | Passed with the new figures included: 71 concepts plus extremes and the Zero to Hero figures at 1280, 390, and 320 pixels; minimum text contrast 8.64:1, minimum graphic contrast 3.70:1; the missing-stylesheet fallback still renders |

Browser tests were run with a locally installed Playwright pointed at the container's pre-installed Chromium. The repository does not vendor Playwright, so `npm run test:browser` still requires a separate install, as before.

## What the numerical tests actually assert

These are the checks that would fail if a lesson's claims stopped being true:

- **Autograd, typed expressions**: six expressions differentiated and compared against central differences; `d(a·a)/da = 6` and `d(a·a·a)/da = 27` at `a = 3`, confirming gradient accumulation at a fan-out; one node per variable; parser errors raised for malformed input.
- **Autograd, composed graphs**: the `Value` form agrees with the expression form to `1e-12` in value and in every gradient on the same formula; backward twice doubles the gradient and `zeroGrad` restores it; three composed functions check against central differences to better than `1e-6`; a `[2, 4, 4, 1]` network with 37 parameters overfits four examples to a loss below `0.01`, and the same run with gradient clearing disabled ends more than ten times worse.
- **Bigram model**: every row sums to 1; the model's loss (about 1.95 nats per bigram on our 125-word list) is below the uniform baseline `log 27 ≈ 3.30`; smoothing raises training loss; sampling is seeded and reproducible.
- **Character MLP**: the smoothed minibatch loss falls by more than 0.3 nats over 300 steps; the parameter count matches a hand-derived formula; two runs with one seed produce identical losses.
- **Initialisation diagnostics**: gain 3 saturates more than 25% of activations in layer 5; gain 0.3 collapses the activation standard deviation to below a fifth of layer 1's; batch normalisation cuts saturation by more than a factor of four; every histogram sums to 1.
- **Gradient check**: the correct derivation matches finite differences to better than `1e-8`; the missing-batch-mean and missing-one-hot rules fail every tensor; the transposed rule fails `W1` and `b1` while `W2` and `b2` still pass — the point the lecture-5 guide makes about partial checks.
- **Hierarchical context**: one level costs the same either way, two levels cost more as a hierarchy, and the crossover where the hierarchy becomes cheaper is located rather than assumed.
- **Attention**: every row of weights sums to 1; no weight above the diagonal exceeds `1e-9`; editing the last token leaves earlier outputs exactly unchanged with the mask and changes them without it; lower temperature sharpens the distribution.
- **Byte-pair encoding**: `decode(encode(x)) == x` for nine probes including empty strings, accented text, indentation, and unseen text; the merge list is a deterministic prefix of a longer run; a leading space produces a different token sequence.
- **GPT-2 accounting**: the 12-layer, 768-wide, 50,257-vocabulary, 1,024-context configuration totals **124,439,808 parameters**, matching the published 124M figure; training compute equals `6 · N · D`; the schedule warms up to the peak, decays monotonically, and stops at a floor rather than zero.
- **Figures**: every figure carries `role="img"`, a title, and a description; contains no `NaN`, `Infinity`, or `undefined`; and keeps every label inside the 600 × 280 viewBox.
- **Track data**: each lecture's guide file exists, its video identifier is well formed, its labs exist in `labs.ts`, its links are HTTPS, and its sample runs in the sandbox without error.
- **Inline examples**: all 19 runnable blocks across the nine guides execute in the sandbox, print output, and contain no `NaN` or `undefined` in what they print. The whole suite still runs in about 1.5 seconds.
- **Python starters**: each guide carries exactly one PyTorch starting point of at least ten lines, points at Colab, and is never marked runnable (the sandbox executes JavaScript, so a Run button on a Python block would only produce an error). Every starter is compiled by `python3` in the test, which skips itself where `python3` is absent.
- **Guides**: each guide links its own video, credits the author, carries the six required sections, and has balanced code fences; `licensing.md` names every referenced repository and flags the unlicensed one.

## Defects found and fixed during validation

1. **Duplicate element id** (`lecture-status`) — caught by the type checker, renamed to `track-status`.
2. **Unused-variable gradients** — the first test run asserted gradients for variables absent from an expression; the engine reports gradients only for variables that appear, which is correct, so the test was corrected.
3. **Wrong claim about hierarchies** — the first test asserted a hierarchy is always more expensive at one level; it is exactly equal there. The guide and the panel now state the crossover rather than a slogan.
4. **Empty figures had no shape** — an empty matrix or series rendered as bare text; both now draw an outlined plate.
5. **Column labels collided** — word labels are wider than a heatmap cell, so long column labels are now drawn as indexes with the names on the rows.
6. **Light text on bright fills** — scatter markers and token plates failed the site's 4.5:1 text-contrast gate; both are now outlined blocks with light text.
7. **Legend overlapped the axis label** in multi-series plots; the legend is now one line.
8. **The context tree's top level collided with its caption**; the level spacing was reduced.

Items 4 to 8 were found only because the new figures were added to `tests/visual-design.browser.ts`, which measures contrast and label placement at three widths.

## Not verified here

- **Node 24.** The repository's engine requirement was not exercised; this run used Node 22.
- **Lecture runtimes and playlist membership.** YouTube is unreachable from this environment. Video identifiers and repository links were read from `karpathy/nn-zero-to-hero` and `karpathy/build-nanogpt`, and no runtimes are stated anywhere in the track.
- **The video embed.** External media cannot load here; the browser test asserts the iframe is created with the right source and that a direct link is offered, not that playback works.
- **The PyTorch starters were compiled, not executed.** This container has no `torch`, so the nine Python starting points are checked for syntax only. Their arithmetic was verified where it does not need a framework: the parameter function reproduces 124,439,808 exactly, and the bigram pairing was run by hand. Run them in Colab before relying on the tensor code.
- **Learning outcomes.** Nothing in this work measures whether the track teaches anyone anything. It is an instructional design plus correctness checks, not an evaluated intervention.
