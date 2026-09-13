# Interactive learning workbench

## Launch

From the repository root:

```bash
npm run dev
```

Open **http://127.0.0.1:8765/site/** in a browser. Stop the server with Ctrl+C. Use `--port 8766` if the default port is occupied. The server binds only to localhost and serves the public course documents/assets; it excludes private records and Git internals. For another computer, run a separate local copy and transfer progress with export/import.

The workbench uses browser-native HTML, CSS, and JavaScript with no package install, API key, account, or paid service. Python 3.9+ is needed for the small server. Modern browsers are expected. External lectures need internet access; text-to-speech depends on browser/OS voices and may use the platform’s speech service.

## Three modes

**Learn and explore:** ten module summaries, prediction prompts, full Markdown module guides, optional spoken summaries, recorded-lecture links/embeds, and four manipulable numerical examples: softmax temperature, causal attention masks, gradient-descent stability, and an exact policy-gradient bandit.

**Retrieve and test:** twenty numerical question families, two per module, with varied parameters where appropriate, immediate feedback, explicit assistance labeling, and scheduled review. The main pattern is predict → attempt → inspect feedback → repair → retry a fresh question. Some invariant questions intentionally keep the same answer under changed problem size; explain why.

**Build and defend:** a concrete implementation assignment, an oral-defense prompt, autosaved evidence notes, and a copyable tutor handoff. Run Python/C++/GPU code in your development environment, then bring commands, diffs, traces, and your explanation to the tutor. The app does not run arbitrary code or pretend to grade a free-text research defense.

## A 60–90 minute learning cycle

1. Spend 5 minutes recalling the previous concept without notes.
2. Read a short lesson or watch a 10–20 minute lecture segment.
3. Predict the visual experiment before changing a control; explain the result in your own words.
4. Spend 10 minutes on numerical/theory questions without assistance.
5. Spend 25–40 minutes implementing, debugging, or testing the corresponding mechanism.
6. Spend 10 minutes explaining the evidence to the tutor and recording the next gap.

This is a chosen instructional workflow, not a claim to have measured an optimal learning rate. Shorten passive material when implementation or recall exposes a gap.

## Zero to Hero companion pages

`site/zero-to-hero.html` holds nine lecture pages for the [companion track](18-zero-to-hero.md). Each page carries a study guide, an opt-in video link, a panel whose numbers are computed in your browser, and an editable code sample.

The panels compute rather than illustrate: a scalar autograd trace with a finite-difference comparison, a bigram count matrix and its loss against the uniform baseline, a character MLP that trains in the tab, activation and gradient statistics across initialisation scales, a gradient check under deliberately broken backward rules, hierarchical versus flat parameter scaling, a real attention head with a causal-invariance readout, byte-pair merges on text you supply, and parameter and compute accounting for a GPT-2 sized run.

Code is runnable where it is explained, not only at the end of the page: any block a guide fences as ```run` becomes an editable cell sitting beside the paragraph it demonstrates, with a Run button, an output pane, and a heatmap when the cell returns a matrix. The Markdown stays plain text everywhere else, so the same guide reads normally on GitHub or in the reader. There are 19 such cells across the nine lectures, and every one of them is executed by the test suite.

The code samples run in a Web Worker with a five-second limit, so an accidental infinite loop terminates a worker instead of freezing the page. Samples have no network or storage access, and edits persist for the browser session only; notes are saved like other course notes and are included in progress exports. Nothing is sent anywhere.

## Review and retention

Correct unaided answers move a concept through 1-, 3-, 7-, and 14-day review intervals. Early repeated successes do not advance the interval. Wrong or assisted attempts schedule another review after ten minutes. These intervals are a transparent heuristic; revise them based on delayed recall and transfer performance.

The sidebar counts attempted concepts and due reviews. It deliberately does not award “mastery” from quiz scores. Use [the practical rubric](../assessments/01-mastery.md) for implementation, debugging, experimental judgment, and explanation. The numeric questions cover selected concepts, not the complete theoretical depth of each module.

## Agent-assisted expertise

The learner already uses agents to generate implementations and outcomes. Practice that workflow with stricter inspection: write the specification and invariants, predict results, ask an agent to implement, review the critical code, inject a failure, and demonstrate a fresh small task independently. This develops both effective direction of agents and personal ability to recognize wrong results.

The learner’s [scaffold repository](https://github.com/victusfate/scaffold) was reviewed as background for this approach. Its staged development and review workflow is useful context, but this workbench does not claim to have installed or integrated that template. The supplied Void Horizon site could not be inspected because it returned HTTP 403; no assumptions about its visual design or implementation were used.

## Progress and portability

Progress is stored in browser localStorage on this origin and port. Clearing browser data, using private browsing, switching browsers, or changing the port may create an empty record. No server-side account or cross-device synchronization is provided.

Export downloads a JSON backup and a Markdown tutor record. Some browsers restrict multiple downloads; the app then offers a separate JSON download button. Import validates the JSON schema and asks before replacing current progress. Keep exported records private if they contain personal information. The Markdown course remains portable even without the workbench.

## Development checks

```bash
npm test
npm run typecheck
npm run check:docs
```

Node is only needed for the JavaScript tests, not normal use. Engine tests cover numerical grading, question generation, storage validation, review scheduling, and safe Markdown rendering. Server tests cover allowed assets and private/traversal paths. Browser smoke validation should additionally exercise navigation, each visual, answer feedback, persistence, export/import, and a mobile viewport. Live video/audio availability is provider/browser dependent.

For the optional browser smoke test, install the testing tool locally (the application itself has no npm dependencies), keep the server running in another terminal, then run:

```bash
npm install --no-save --package-lock=false playwright
npx playwright install chromium
npm run test:browser
```

The test uses a temporary browser profile and writes inspection screenshots under `/tmp`. `LAB_URL` can select another local server origin; `PLAYWRIGHT_MODULE` can point to an already-installed Playwright module. Node 20+ is a suitable test environment. Keep tooling versions recorded when reproducing the browser validation.

## Full lessons, submodules, and reference reader

Start with the full module overview and choose one of 35 dedicated submodule pages. Each combines explanatory text, a short narrated clip with transcript, an interactive example, and relevant lab links. All 52 labs have dedicated guidance pages and local evidence notes. Foundations includes eight detailed walkthrough sections and a runnable NumPy example.

Click dotted terms to open one of 67 concept explanations, explore related ideas, or open a referenced lecture. Select any phrase and choose Explain selection for a contextual lookup. Unknown phrases provide an honest tutor handoff rather than inventing a definition. Using explanations during a theory check marks assistance.

Readings open in a formatted HTML reader with headings, tables, lists, code blocks, section navigation, concept exploration, and referenced video controls. Raw Markdown remains available. Narration uses Mitchell, a stock New Zealand English neural voice; the main button is labeled Listen. The site requires no live model service.

See the [hosting guide](14-hosting.md) for GitHub Pages and Cloudflare Pages deployment. Browser-local learning records do not automatically sync across domains.
