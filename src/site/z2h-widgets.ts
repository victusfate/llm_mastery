// Interactive panels for the Zero to Hero track.
//
// One panel per lecture. Each declares its controls and a pure render function,
// so the numbers on screen come from the same routines the learner is asked to
// reimplement in Python, and every figure can be regenerated from the control
// values alone.

import { escapeHTML as esc } from "./engine.ts";
import { barsGraphic } from "./graphics.ts";
import * as z from "./z2h-numerics.ts";
import { NAMES, TOKENIZER_SAMPLE, ATTENTION_SENTENCE } from "./z2h-data.ts";
import { traceGraphic, matrixGraphic, scatterGraphic, histogramGraphic, seriesGraphic, treeGraphic, tokenRibbonGraphic } from "./z2h-visuals.ts";

export type WidgetKind =
  | "autograd"
  | "bigram"
  | "mlp"
  | "activations"
  | "gradcheck"
  | "hierarchy"
  | "attention"
  | "tokenizer"
  | "budget";

type ControlSpec =
  | { name: string; kind: "slider"; label: string; min: number; max: number; step: number; value: number }
  | { name: string; kind: "text"; label: string; value: string }
  | { name: string; kind: "textarea"; label: string; value: string }
  | { name: string; kind: "checkbox"; label: string; value: boolean }
  | { name: string; kind: "select"; label: string; value: string; options: { value: string; label: string }[] };

type Values = Record<string, number | string | boolean>;

interface Widget {
  title: string;
  controls: ControlSpec[];
  /** Expensive panels redraw on an explicit run instead of on every keystroke. */
  manual?: boolean;
  runLabel?: string;
  render(values: Values): { figures: string; readout: string; note: string };
}

const number = (values: Values, name: string) => Number(values[name]);
const metrics = (entries: [string, string][]) =>
  '<div class="metrics">' + entries.map(([value, label]) => `<div class="metric"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join("") + "</div>";
const table = (headers: string[], rows: string[][]) =>
  '<div class="table-scroll"><table><thead><tr>' +
  headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("") +
  "</tr></thead><tbody>" +
  rows.map((row) => "<tr>" + row.map((cell) => `<td>${esc(cell)}</td>`).join("") + "</tr>").join("") +
  "</tbody></table></div>";
const fixed = (value: number, digits = 3) => (Number.isFinite(value) ? value.toFixed(digits) : "—");
const compact = (value: number) =>
  Math.abs(value) >= 1e9 ? `${(value / 1e9).toFixed(2)}B` : Math.abs(value) >= 1e6 ? `${(value / 1e6).toFixed(2)}M` : Math.abs(value) >= 1e3 ? `${(value / 1e3).toFixed(1)}K` : value.toFixed(0);

const widgets: Record<WidgetKind, Widget> = {
  autograd: {
    title: "Differentiate an expression you choose",
    controls: [
      { name: "expression", kind: "text", label: "Expression in a, b, c", value: "(a*b + c) * tanh(a)" },
      { name: "a", kind: "slider", label: "a", min: -3, max: 3, step: 0.1, value: 1.5 },
      { name: "b", kind: "slider", label: "b", min: -3, max: 3, step: 0.1, value: -2 },
      { name: "c", kind: "slider", label: "c", min: -3, max: 3, step: 0.1, value: 0.5 },
    ],
    render(values) {
      const variables = { a: number(values, "a"), b: number(values, "b"), c: number(values, "c") };
      let parsed: z.Expression;
      try {
        parsed = z.parseExpression(String(values.expression));
      } catch (error) {
        return {
          figures: "",
          readout: `<p class="failure">${esc((error as Error).message)}. Use a, b, c, numbers, + - * / ^ and tanh, exp, log, relu, sigmoid.</p>`,
          note: "Fix the expression to continue.",
        };
      }
      const trace = z.backpropagate(parsed, variables);
      const rows = Object.keys(variables).map((name) => {
        const analytic = trace.grads[name] ?? 0;
        const numeric = z.numericGradient(parsed, variables, name);
        return [name, fixed(variables[name], 2), fixed(analytic, 6), fixed(numeric, 6), fixed(Math.abs(analytic - numeric), 9)];
      });
      const worst = Math.max(...rows.map((row) => Number(row[4])));
      return {
        figures: traceGraphic(trace),
        readout:
          metrics([
            [fixed(trace.value), "output value"],
            [String(trace.nodes.length), "nodes in the graph"],
            [worst.toExponential(1), "largest backward vs numeric gap"],
          ]) +
          table(["variable", "value", "backward gradient", "central difference", "absolute difference"], rows) +
          table(
            ["node", "operation", "value", "gradient"],
            trace.nodes.map((node) => [String(node.id), node.op, fixed(node.value, 4), fixed(node.grad, 4)]),
          ),
        note:
          worst < 1e-4
            ? "Backward pass and finite differences agree, so the local derivative rules compose correctly. A variable that appears twice accumulates gradient from both paths."
            : "The gap is large: either the expression is numerically delicate at these values or a local rule is wrong. Reduce the magnitudes and check again.",
      };
    },
  },

  bigram: {
    title: "A counting model is already a language model",
    controls: [
      { name: "smoothing", kind: "slider", label: "Add-k smoothing", min: 0, max: 5, step: 0.5, value: 1 },
      { name: "shown", kind: "slider", label: "Characters shown", min: 6, max: 12, step: 1, value: 9 },
      { name: "seed", kind: "slider", label: "Sampling seed", min: 1, max: 40, step: 1, value: 7 },
    ],
    render(values) {
      const model = z.trainBigram(NAMES, number(values, "smoothing"));
      const shown = Math.min(number(values, "shown"), model.characters.length);
      const labels = model.characters.slice(0, shown);
      const counts = model.counts.slice(0, shown).map((row) => row.slice(0, shown));
      const random = z.rng(number(values, "seed"));
      const samples = Array.from({ length: 6 }, () => z.sampleBigram(model, random)).filter(Boolean);
      const uniform = z.uniformLoss(model.characters.length);
      return {
        figures:
          matrixGraphic(counts, {
            rowLabels: labels,
            caption: `Bigram counts for the first ${shown} characters`,
            description: `Counts of each character following another across ${NAMES.length} training words. The first label is the word-boundary token.`,
          }) +
          barsGraphic([model.loss, uniform], ["Bigram", "Uniform"], "Mean negative log likelihood per bigram"),
        readout:
          metrics([
            [fixed(model.loss), "training loss (nats/bigram)"],
            [fixed(uniform), "uniform baseline"],
            [String(model.characters.length), "vocabulary including boundary"],
            [samples.join(", ") || "—", "sampled words"],
          ]) +
          table(
            ["from", "most likely next", "probability"],
            labels.slice(1).map((character, index) => {
              const row = model.probabilities[index + 1];
              const best = row.indexOf(Math.max(...row));
              return [character, model.characters[best] === "." ? "(end)" : model.characters[best], fixed(row[best])];
            }),
          ),
        note:
          "Smoothing moves probability mass onto pairs that never appeared. Raising it makes the model more forgiving of unseen pairs and worse on the pairs it did see, which is why the loss rises.",
      };
    },
  },

  mlp: {
    title: "Train a character MLP in this tab",
    manual: true,
    runLabel: "Train the model",
    controls: [
      { name: "steps", kind: "slider", label: "Training steps", min: 50, max: 1200, step: 50, value: 400 },
      { name: "hidden", kind: "slider", label: "Hidden units", min: 4, max: 48, step: 4, value: 24 },
      { name: "learningRate", kind: "slider", label: "Learning rate", min: 0.05, max: 1.5, step: 0.05, value: 0.4 },
      { name: "context", kind: "slider", label: "Context characters", min: 1, max: 4, step: 1, value: 3 },
    ],
    render(values) {
      const run = z.trainCharMLP({
        words: NAMES,
        steps: number(values, "steps"),
        hidden: number(values, "hidden"),
        learningRate: number(values, "learningRate"),
        context: number(values, "context"),
        embedding: 2,
        seed: 4,
      });
      const window = Math.max(1, Math.floor(run.lossHistory.length / 40));
      const smoothed = Array.from({ length: Math.floor(run.lossHistory.length / window) }, (_, i) => {
        const slice = run.lossHistory.slice(i * window, (i + 1) * window);
        return slice.reduce((a, b) => a + b, 0) / slice.length;
      });
      const bigram = z.trainBigram(NAMES).loss;
      return {
        figures:
          seriesGraphic([{ label: "smoothed minibatch loss", values: smoothed }], "Training loss", {
            xLabel: `Step (averaged over ${window})`,
          }) + scatterGraphic(run.embeddings, run.characters, "Learned two-dimensional character embeddings"),
        readout:
          metrics([
            [fixed(run.trainLoss), "training loss"],
            [fixed(run.heldOutLoss), "held-out loss"],
            [fixed(bigram), "bigram baseline"],
            [String(run.parameters), "parameters"],
            [run.samples.filter(Boolean).join(", ") || "—", "sampled words"],
          ]),
        note:
          run.heldOutLoss > run.trainLoss + 0.75
            ? "Held-out loss is far above training loss: with this tiny word list the model is memorising. That gap is the quantity to report, not the training curve."
            : "Training and held-out loss are close. Raise the step count or hidden width until they separate, and note where that happens.",
      };
    },
  },

  activations: {
    title: "See initialisation before training anything",
    controls: [
      { name: "gain", kind: "slider", label: "Weight gain", min: 0.2, max: 3, step: 0.1, value: 1 },
      { name: "depth", kind: "slider", label: "Layers", min: 2, max: 8, step: 1, value: 5 },
      { name: "normalised", kind: "checkbox", label: "Normalise each layer over the batch", value: false },
    ],
    render(values) {
      const report = z.initialisationDiagnostics({
        gain: number(values, "gain"),
        depth: number(values, "depth"),
        normalised: Boolean(values.normalised),
        width: 32,
        batch: 64,
      });
      const last = report.layers[report.layers.length - 1];
      return {
        figures:
          histogramGraphic(last.histogram, `Activations in layer ${last.layer}`, last.saturatedFraction) +
          seriesGraphic(
            [
              { label: "activation standard deviation", values: report.layers.map((l) => l.activationStd) },
              { label: "gradient standard deviation", values: report.layers.map((l) => l.gradientStd), comparison: true },
            ],
            "Forward and backward statistics per layer",
            { logScale: true, xLabel: "Layer index (logarithmic vertical axis)" },
          ),
        readout:
          metrics([
            [fixed(last.activationStd), "last-layer activation std"],
            [`${(100 * last.saturatedFraction).toFixed(1)}%`, "saturated activations"],
            [last.gradientStd.toExponential(2), "first-layer gradient std"],
            [`${(100 * report.deadOutputFraction).toFixed(0)}%`, "always-saturated units"],
          ]) +
          table(
            ["layer", "activation std", "saturated", "gradient std"],
            report.layers.map((layer) => [
              String(layer.layer),
              fixed(layer.activationStd),
              `${(100 * layer.saturatedFraction).toFixed(1)}%`,
              layer.gradientStd.toExponential(2),
            ]),
          ),
        note:
          number(values, "gain") > 1.6 && !values.normalised
            ? "A large gain drives tanh into its flat tails, where the local derivative is near zero: the forward pass looks busy while the backward pass carries almost nothing."
            : number(values, "gain") < 0.6 && !values.normalised
              ? "A small gain shrinks the signal layer by layer, so deeper layers see almost no variation and their gradients are tiny in absolute terms."
              : "Normalising each layer over the batch removes most of the dependence on the gain; the same statistics then look similar at many initial scales.",
      };
    },
  },

  gradcheck: {
    title: "Break one backward rule and watch the check catch it",
    controls: [
      {
        name: "rule",
        kind: "select",
        label: "Backward rule",
        value: "correct",
        options: [
          { value: "correct", label: "Correct derivation" },
          { value: "no-batch-mean", label: "Forget the 1/batch factor" },
          { value: "no-onehot", label: "Forget to subtract the target" },
          { value: "transposed-hidden", label: "Wrong orientation on the way back" },
        ],
      },
    ],
    render(values) {
      const check = z.gradientCheck(values.rule as z.GradientRule);
      const logs = check.entries.map((entry) => Math.log10(Math.max(entry.maxError, 1e-12)));
      return {
        figures: barsGraphic(logs, check.entries.map((e) => e.name), "log₁₀ of the largest gradient error per tensor"),
        readout:
          metrics([
            [check.passed ? "matches" : "fails", "finite-difference check"],
            [check.entries.filter((e) => e.passed).length + "/" + check.entries.length, "tensors within tolerance"],
          ]) +
          table(
            ["tensor", "largest absolute error", "within 1e-5"],
            check.entries.map((entry) => [entry.name, entry.maxError.toExponential(2), entry.passed ? "yes" : "no"]),
          ),
        note: check.explanation,
      };
    },
  },

  hierarchy: {
    title: "Widen the context without one enormous layer",
    controls: [
      { name: "fanIn", kind: "slider", label: "Positions combined per level", min: 2, max: 4, step: 1, value: 2 },
      { name: "depth", kind: "slider", label: "Levels", min: 1, max: 6, step: 1, value: 3 },
      { name: "hidden", kind: "slider", label: "Hidden width", min: 16, max: 256, step: 16, value: 64 },
    ],
    render(values) {
      const plan = z.contextPlan({
        fanIn: number(values, "fanIn"),
        depth: number(values, "depth"),
        hidden: number(values, "hidden"),
        embedding: 16,
      });
      const crossover = plan.scaling.find((point) => point.hierarchical < point.flat);
      return {
        figures:
          treeGraphic(plan.fanIn, plan.depth) +
          seriesGraphic(
            [
              { label: "one wide layer", values: plan.scaling.map((p) => p.flat) },
              { label: "hierarchy of levels", values: plan.scaling.map((p) => p.hierarchical), comparison: true },
            ],
            "Parameters as the context grows",
            { logScale: true, xLabel: "Levels (context = fan-in ^ levels), logarithmic vertical axis" },
          ),
        readout:
          metrics([
            [String(plan.contextLength), "context positions"],
            [compact(plan.flatParameters), "one wide layer"],
            [compact(plan.hierarchicalParameters), "hierarchy"],
            [crossover ? `${crossover.contextLength} positions` : "beyond this range", "hierarchy becomes cheaper at"],
          ]) +
          table(
            ["levels", "context", "one wide layer", "hierarchy"],
            plan.scaling.map((point) => [String(point.depth), String(point.contextLength), compact(point.flat), compact(point.hierarchical)]),
          ),
        note:
          "A hierarchy is not automatically smaller. It costs more at short contexts and less at long ones, and the crossover moves with the hidden width — find it before claiming an architecture is efficient.",
      };
    },
  },

  attention: {
    title: "One causal attention head, computed here",
    controls: [
      { name: "length", kind: "slider", label: "Sequence length", min: 2, max: 6, step: 1, value: 6 },
      { name: "temperature", kind: "slider", label: "Score temperature", min: 0.3, max: 3, step: 0.1, value: 1 },
      { name: "causal", kind: "checkbox", label: "Apply the causal mask", value: true },
    ],
    render(values) {
      const tokens = ATTENTION_SENTENCE.slice(0, number(values, "length"));
      const result = z.selfAttention({
        tokens,
        causal: Boolean(values.causal),
        temperature: number(values, "temperature"),
        headDim: 8,
      });
      const drift = result.earlierPositionDrift;
      return {
        figures:
          matrixGraphic(result.weights, {
            rowLabels: tokens,
            caption: "Attention weights: rows are queries",
            description: `Softmax attention weights over ${tokens.length} positions${result.causal ? " with future positions masked" : " with no mask, so every position sees the whole sequence"}.`,
            mask: result.causal,
          }) +
          barsGraphic(result.rowSums, tokens, "Row sums: each query distributes weight 1"),
        readout:
          metrics([
            [fixed(Math.max(...result.rowSums), 6), "largest row sum"],
            [drift < 1e-12 ? "0" : drift.toExponential(2), "change in earlier outputs after editing the last token"],
            [result.causal ? "applied" : "removed", "causal mask"],
          ]) +
          table(
            ["query", ...tokens.map((token, i) => `${i}:${token}`)],
            result.weights.map((row, i) => [`${i}:${tokens[i]}`, ...row.map((w) => fixed(w, 3))]),
          ),
        note: result.causal
          ? "Editing the final token leaves every earlier output bit-for-bit identical. That invariance is the property to assert in a test; a plausible loss curve is not evidence of it."
          : "Without the mask, editing the final token changes earlier outputs. Training on this leaks the answer backwards and the loss looks better than the model is.",
      };
    },
  },

  tokenizer: {
    title: "Train a byte-pair tokenizer on your own text",
    controls: [
      { name: "text", kind: "textarea", label: "Training text", value: TOKENIZER_SAMPLE },
      { name: "merges", kind: "slider", label: "Merges to learn", min: 0, max: 80, step: 4, value: 32 },
      { name: "probe", kind: "text", label: "Encode this string", value: "the tokenizer sees 1234" },
    ],
    render(values) {
      const model = z.trainBPE(String(values.text), number(values, "merges"));
      const probe = String(values.probe);
      const ids = z.encodeBPE(model, probe);
      const pieces = z.tokenPieces(model, ids);
      const restored = z.decodeBPE(model, ids);
      return {
        figures:
          tokenRibbonGraphic(pieces, `Tokens of the probe string (${ids.length} tokens)`) +
          seriesGraphic([{ label: "occurrences of the merged pair", values: model.merges.map((m) => m.count) }], "Merge frequency in learning order", {
            xLabel: "Merge index",
          }),
        readout:
          metrics([
            [String(model.vocabularySize), "vocabulary size"],
            [`${model.bytes} → ${model.ids.length}`, "training bytes → tokens"],
            [fixed(model.compression, 2) + "×", "compression on the training text"],
            [restored === probe ? "exact" : "broken", "decode(encode(text)) round trip"],
          ]) +
          table(
            ["token", "bytes", "text"],
            pieces.map((piece, i) => [String(ids[i]), String(new TextEncoder().encode(piece).length), JSON.stringify(piece)]),
          ) +
          table(
            ["merge", "new id", "pair count", "piece"],
            model.merges.slice(0, 20).map((merge, i) => [String(i + 1), String(merge.id), String(merge.count), JSON.stringify(merge.piece)]),
          ),
        note:
          "Merges are learned from this text only, so the vocabulary inherits its habits: leading spaces attach to words, digits split by frequency rather than by place value, and characters outside the sample stay as raw bytes.",
      };
    },
  },

  budget: {
    title: "Price the run before renting the GPU",
    controls: [
      { name: "layers", kind: "slider", label: "Layers", min: 4, max: 48, step: 2, value: 12 },
      { name: "width", kind: "slider", label: "Model width", min: 128, max: 2048, step: 64, value: 768 },
      { name: "tokens", kind: "slider", label: "Training tokens (billions)", min: 1, max: 300, step: 1, value: 10 },
      { name: "tflops", kind: "slider", label: "Device TFLOP/s (dense)", min: 10, max: 1000, step: 10, value: 400 },
      { name: "utilisation", kind: "slider", label: "Model FLOPs utilisation", min: 0.1, max: 0.7, step: 0.05, value: 0.4 },
      { name: "devices", kind: "slider", label: "Devices", min: 1, max: 64, step: 1, value: 8 },
    ],
    render(values) {
      const counts = z.parameterCount({ layers: number(values, "layers"), width: number(values, "width") });
      const devices = number(values, "devices");
      const budget = z.trainingBudget({
        parameters: counts.total,
        tokens: number(values, "tokens") * 1e9,
        deviceTflops: number(values, "tflops") * devices,
        utilisation: number(values, "utilisation"),
        dollarsPerHour: 2 * devices,
      });
      const schedule = z.learningRateSchedule({ steps: 120, warmup: 15, peak: 6e-4 });
      return {
        figures:
          seriesGraphic([{ label: "learning rate", values: schedule }], "Warmup then cosine decay", { xLabel: "Optimizer step" }) +
          barsGraphic(
            [counts.embedding, counts.positional, counts.attention, counts.feedForward],
            ["Embedding", "Position", "Attention", "Feed-forward"],
            "Parameters by component",
          ),
        readout:
          metrics([
            [compact(counts.total), "parameters"],
            [budget.flops.toExponential(2), "estimated training FLOPs"],
            [fixed(budget.hours, 1) + " h", `wall clock on ${devices} device${devices > 1 ? "s" : ""}`],
            ["$" + fixed(budget.dollars, 0), "rental cost at $2/device-hour"],
            [fixed(budget.tokensPerParameter, 1), "tokens per parameter"],
            [compact(budget.chinchillaOptimalTokens), "tokens at 20 per parameter"],
          ]) +
          table(
            ["component", "parameters", "share"],
            [
              ["embedding", compact(counts.embedding), fixed((100 * counts.embedding) / counts.total, 1) + "%"],
              ["positional", compact(counts.positional), fixed((100 * counts.positional) / counts.total, 1) + "%"],
              ["attention", compact(counts.attention), fixed((100 * counts.attention) / counts.total, 1) + "%"],
              ["feed-forward", compact(counts.feedForward), fixed((100 * counts.feedForward) / counts.total, 1) + "%"],
            ],
          ),
        note:
          "Compute is estimated as 6 × parameters × tokens and time as compute ÷ (device peak × utilisation): planning arithmetic, not a measured run. Measure your own tokens per second before trusting any of these hours.",
      };
    },
  },
};

export function widgetTitle(kind: WidgetKind): string {
  return widgets[kind].title;
}

/** Build the controls, draw once, and redraw on input or on an explicit run. */
export function mountWidget(root: HTMLElement, kind: WidgetKind): void {
  const widget = widgets[kind];
  const controls = document.createElement("div");
  controls.className = "widget-controls";
  const figures = document.createElement("div");
  const readout = document.createElement("div");
  const note = document.createElement("p");
  note.className = "muted";
  readout.setAttribute("aria-live", "polite");
  const values: Values = {};
  const inputs: HTMLElement[] = [];

  for (const spec of widget.controls) {
    const wrapper = document.createElement("label");
    wrapper.htmlFor = `z2h-${kind}-${spec.name}`;
    wrapper.append(document.createTextNode(spec.label));
    let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (spec.kind === "select") {
      input = document.createElement("select");
      for (const option of spec.options) {
        const element = document.createElement("option");
        element.value = option.value;
        element.textContent = option.label;
        input.append(element);
      }
      input.value = spec.value;
      values[spec.name] = spec.value;
    } else if (spec.kind === "textarea") {
      input = document.createElement("textarea");
      input.rows = 6;
      input.value = spec.value;
      values[spec.name] = spec.value;
    } else {
      input = document.createElement("input");
      if (spec.kind === "slider") {
        Object.assign(input, { type: "range", min: spec.min, max: spec.max, step: spec.step, value: spec.value });
        values[spec.name] = spec.value;
        const output = document.createElement("output");
        output.textContent = String(spec.value);
        wrapper.append(document.createTextNode(": "), output);
        input.addEventListener("input", () => {
          output.textContent = (input as HTMLInputElement).value;
        });
      } else if (spec.kind === "checkbox") {
        input.type = "checkbox";
        (input as HTMLInputElement).checked = spec.value;
        values[spec.name] = spec.value;
        wrapper.classList.add("check");
      } else {
        input.type = "text";
        input.value = spec.value;
        values[spec.name] = spec.value;
      }
    }
    input.id = wrapper.htmlFor;
    const read = () =>
      spec.kind === "checkbox" ? (input as HTMLInputElement).checked : spec.kind === "slider" ? Number(input.value) : input.value;
    input.addEventListener("input", () => {
      values[spec.name] = read();
      if (!widget.manual) draw();
    });
    input.addEventListener("change", () => {
      values[spec.name] = read();
      if (!widget.manual) draw();
    });
    if (spec.kind === "checkbox") wrapper.prepend(input);
    else wrapper.append(document.createElement("br"), input);
    controls.append(wrapper);
    inputs.push(input);
  }

  const status = document.createElement("p");
  status.className = "small";
  status.setAttribute("role", "status");
  if (widget.manual) {
    const run = document.createElement("button");
    run.type = "button";
    run.className = "primary";
    run.textContent = widget.runLabel ?? "Run";
    run.onclick = () => {
      status.textContent = "Working…";
      // Yield once so the status text paints before a long synchronous run.
      setTimeout(() => {
        const started = performance.now();
        draw();
        status.textContent = `Finished in ${Math.round(performance.now() - started)} ms in this browser tab.`;
      }, 0);
    };
    controls.append(run);
  }

  function draw() {
    try {
      const result = widget.render(values);
      figures.innerHTML = result.figures;
      readout.innerHTML = result.readout;
      note.textContent = result.note;
    } catch (error) {
      figures.innerHTML = "";
      readout.innerHTML = `<p class="failure">This panel could not be computed: ${esc((error as Error).message)}</p>`;
      note.textContent = "Change a control to recover.";
    }
  }

  root.replaceChildren(controls, figures, readout, note, status);
  draw();
}
