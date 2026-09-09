# Visualization design review — September 9, 2026

## Scope and findings

Reviewed all 71 concept entries, every distinct SVG mechanism, all 11 submodule sandbox types, the four overview experiments, and concept-dialog presentation. Checked normal and extreme slider values, desktop and narrow layouts, text and essential-shape contrast, missing CSS, and keyboard scrolling. This is a visualization review, not a certification of the entire site's accessibility.

| Finding | Impact | Resolution |
| --- | --- | --- |
| SVG depended on external CSS for colors and strokes | The reported screenshot showed black nodes/text and invisible connections | Essential presentation attributes now travel inside every SVG. A missing-stylesheet regression test covers every concept. |
| Unversioned CSS/scripts | A cached stylesheet could be paired with new diagram markup; the live CSS contained the expected rules when inspected, so the exact client cache state is unconfirmed | Production HTML references CSS and bundled scripts with content-derived versions. |
| Responsive SVG text shrank to 7.37px at a 390px viewport | Labels were technically present but unreadable | 16px labels at a minimum 600px diagram width; keyboard-focusable horizontal scrolling, visible scrolling guidance, and a wrapping plain-text description below every diagram. |
| Low-opacity embedding cells | Some numerical features faded into the background | Increased minimum opacity and measured composited contrast. |
| Dense hidden layer and labels | Large hidden layers crowded neurons and bottom labels | Show at most six separated hidden neurons, label truncation explicitly, and reserve room below nodes. |
| Weak inactive-state distinction | Masks and evaluation outcomes relied on subtle dark fills | Use clear outlines for inactive positions and filled shapes for active positions; distinguish secondary paths with dashes. |
| Small attention-matrix text | Eight columns compressed coordinates | Increased text and cell size with a dedicated keyboard-scrollable region. |
| Loss landscape node did not lie on its curve | The graphic muddied the explanation | Corrected the plotted bowl and parameter position. |

## Measured validation

- `npm run check`: TypeScript, 15 course/engine tests, local Markdown links, and static build passed.
- Full browser suite passed, covering module navigation, four overview experiments, reading, concept dialogs, audio, learning records, backups, all 11 sandbox types, and slider extremes.
- Every concept and additional extreme-state diagrams checked at viewport widths 1280, 390, and 320 pixels: no out-of-viewBox text, no page overflow, and SVG text at least 16px.
- Minimum measured SVG text contrast: **8.64:1**. Minimum measured essential graphic contrast: **4.90:1**. Calculations include embedding opacity and worker-block backgrounds.
- Sandbox labels, metrics, descriptions, buttons, and heatmap coordinates separately checked against a minimum text contrast of 4.5:1.
- All concepts retain visible SVG text and connections with the page stylesheet removed.
- Keyboard horizontal scrolling and concept-dialog graphic visibility passed.
- Manually inspected five rendered contact sheets covering every distinct mechanism, including extreme worker/network states, and a narrow layout screenshot. Review artifacts are generated outside Git in `/tmp/llm-visual-design/`.
- Publication now requires the full browser suite against the development server, followed by smoke and visualization checks against the built static site in GitHub Actions. The reading test separately exercises development-server Markdown redirects.

The palette targets the [W3C minimum text contrast criteria](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [essential non-text contrast criteria](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Wide diagrams keep their spatial relationships inside a scrolling region while surrounding prose wraps; see [W3C reflow guidance for two-dimensional content](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

## Reproduce

Run `npm run check`, start `npm run dev`, and run `npm run test:browser` with Playwright installed separately (set `PLAYWRIGHT_MODULE` to its `index.mjs` path). The visual-design test writes computed results and review sheets to `/tmp/llm-visual-design/`.

For the static build, serve `dist/` on port 8765 and run `tests/browser-smoke.ts` and `tests/visuals.browser.ts` with Node and the same Playwright setting.
