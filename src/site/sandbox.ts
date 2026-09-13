import { descentGraphic, networkGraphic, barsGraphic, attentionGraphic, corpusGraphic, workersGraphic, maskGraphic, computationGraphic, policyGraphic } from './graphics.ts';
import { softmax } from "./engine.ts";
import { metric } from "./z2h-readout.ts";
export function mountSandbox(root, kind) {
  const controls = document.createElement("div"),
    view = document.createElement("div"),
    explanation = document.createElement("p");
  view.setAttribute("aria-live", "polite");
  explanation.className = "muted";
  root.replaceChildren(controls, view, explanation);
  const sliders = [];
  function slider(label, min, max, step, value) {
    const row = document.createElement("label"),
      input = document.createElement("input"),
      out = document.createElement("output");
    row.append(document.createTextNode(label + ": "), out);
    input.type = "range";
    Object.assign(input, { min, max, step, value });
    row.append(document.createElement("br"), input);
    controls.append(row);
    sliders.push({ input, out });
    input.oninput = draw;
    return () => Number(input.value);
  }
  let a, b;
  if (kind === "softmax") {
    a = slider("Temperature", 0.2, 3, 0.1, 1);
  } else if (kind === "attention") {
    a = slider("Sequence length", 2, 8, 1, 5);
  } else if (kind === "shapes") {
    a = slider("Batch size", 1, 32, 1, 4);
    b = slider("Hidden width", 2, 32, 2, 8);
  } else if (kind === "gradient") {
    a = slider("Correct-class probability", 0.05, 0.95, 0.05, 0.5);
    b = slider("Batch size", 1, 8, 1, 2);
  } else if (kind === "descent") {
    a = slider("Learning rate", 0.05, 2.5, 0.05, 0.4);
  } else if (kind === "bandit") {
    a = slider("Probability of action A", 0.01, 0.99, 0.01, 0.5);
  } else if (kind === "curation") {
    a = slider("Rejected by filter (%)", 0, 90, 5, 10);
    b = slider("Duplicates among remaining (%)", 0, 90, 5, 20);
  } else if (kind === "batch") {
    a = slider("Workers", 1, 8, 1, 2);
    b = slider("Accumulation steps", 1, 16, 1, 4);
  } else if (kind === "mask") {
    a = slider("Response tokens", 1, 20, 1, 5);
    b = slider("Padding tokens", 0, 20, 1, 3);
  } else if (kind === "evaluation") {
    a = slider("Correct responses (of 100)", 0, 80, 1, 60);
    b = slider("Invalid responses", 0, 20, 1, 10);
  }
  function draw() {
    for (const s of sliders) s.out.value = s.input.value;
    if (kind === "graph") {
      view.innerHTML = '<div class="training-graph"></div>';
      const graph = view.firstElementChild;
      for (const term of [
        "Tensor",
        "Parameter",
        "Logit",
        "Loss",
        "Gradient",
        "Optimizer",
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.term = term;
        button.textContent = term;
        graph.append(button);
        if (term !== "Optimizer") graph.append(document.createTextNode(" → "));
      }
      explanation.textContent =
        "Follow one update: inputs and parameters produce logits; labels and logits define the loss; backward produces gradients; the optimizer changes parameters. Click any step to inspect it. The updated parameters are used for the next batch.";
    } else if (kind === "softmax") {
      const p = softmax([2, 1, 0], a());
      view.innerHTML =
        '<div class="bars">' +
        p
          .map(
            (x, i) =>
              `<div class="bar-row"><span>logit ${2 - i}</span><div class="bar-track"><div class="bar-fill" style="width:${x * 100}%"></div></div><span>${(100 * x).toFixed(1)}%</span></div>`,
          )
          .join("") +
        "</div>";
      explanation.textContent =
        "The scores remain [2,1,0]. Temperature changes the probability distribution without changing model parameters. Predict the direction before dragging.";
    } else if (kind === "attention") {
      const n = a();
      view.innerHTML =
        `<div class="heatmap" style="grid-template-columns:repeat(${n},1fr)">` +
        Array.from(
          { length: n * n },
          (_, i) =>
            `<div class="cell ${i % n <= Math.floor(i / n) ? "on" : ""}">${Math.floor(i / n)},${i % n}</div>`,
        ).join("") +
        "</div>";
    const heatmap = view.querySelector('.heatmap');
    const scroll = document.createElement('div');
    scroll.className = 'heatmap-scroll';
    scroll.tabIndex = 0;
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', 'Attention mask; scroll horizontally for all columns');
    heatmap.replaceWith(scroll);
    scroll.append(heatmap);
      explanation.textContent = `There are ${(n * (n + 1)) / 2} allowed query–key pairs including the diagonal, out of ${n * n} score positions. Rows are queries. This shows a mask, not learned attention weights.`;
    } else if (kind === "shapes") {
      view.innerHTML =
        '<div class="metrics">' +
        metric(`${a()} × 2`, "inputs") +
        metric(`${a()} × ${b()}`, "hidden activations") +
        metric(`${a()} × 2`, "logits") +
        metric(5 * b() + 2, "parameters including biases") +
        "</div>";
      explanation.textContent =
        "For 2 input features, h hidden features, and 2 classes: parameters = 2h + h + 2h + 2. Increasing batch size changes activations, not parameter count.";
    } else if (kind === "gradient") {
      view.innerHTML =
        '<div class="metrics">' +
        metric((-Math.log(a())).toFixed(3), "this example’s loss") +
        metric(
          ((a() - 1) / b()).toFixed(3),
          "correct-logit gradient contribution",
        ) +
        metric(
          ((1 - a()) / b()).toFixed(3),
          "other-logit gradient contribution",
        ) +
        "</div>";
      explanation.textContent =
        "This binary example contributes (p−y)/B to a mean-batch gradient. The displayed loss is the single-example loss; other batch examples are unspecified. A negative correct-logit gradient means descent raises that score.";
    } else if (kind === "descent") {
      let x = 2;
      const xs = [x];
      for (let i = 0; i < 18; i++) {
        x *= 1 - a();
        xs.push(x);
      }

      view.innerHTML = descentGraphic(a());
      explanation.textContent = `L(x)=x²/2 gives x_next=(1−rate)x. Final x=${x.toFixed(4)}. This quadratic converges for 0<rate<2; its threshold is not a general neural-network recipe.`;
    } else if (kind === "bandit") {
      view.innerHTML =
        '<div class="metrics">' +
        metric((1 + 2 * a()).toFixed(3), "expected reward") +
        metric(
          (2 * a() * (1 - a())).toFixed(3),
          "derivative with respect to logit",
        ) +
        "</div>";
      explanation.textContent =
        "Action A earns 3 and B earns 1. With p(A)=sigmoid(z), J=1+2p and dJ/dz=2p(1−p). Compare this exact gradient with a Monte Carlo estimator in your lab.";
    } else if (kind === "curation") {
      const filtered = 1000 * (1 - a() / 100),
        kept = filtered * (1 - b() / 100);
      view.innerHTML =
        '<div class="metrics">' +
        metric(1000, "input documents") +
        metric(filtered.toFixed(0), "after quality filter") +
        metric(kept.toFixed(0), "after deduplication") +
        "</div>";
      explanation.textContent =
        "Duplicate percentage applies to the remaining documents. These are count calculations, not a measured quality improvement. A smaller retained corpus also changes repeat exposure under a fixed token budget.";
    } else if (kind === "batch") {
      view.innerHTML =
        '<div class="metrics">' +
        metric(a(), "workers") +
        metric(4, "microbatch per worker") +
        metric(b(), "accumulation steps") +
        metric(a() * 4 * b(), "global sequences per update") +
        "</div>";
      explanation.textContent =
        "Assumes equal sequence contributions and correct mean-loss scaling. Variable valid-token counts require care; multiplying these counts does not make gradients automatically equivalent.";
    } else if (kind === "mask") {
      view.innerHTML =
        '<div class="metrics">' +
        metric(20, "prompt tokens: masked labels") +
        metric(a(), "response tokens: supervised") +
        metric(b(), "padding tokens: masked labels") +
        metric(a(), "loss denominator") +
        "</div>";
      explanation.textContent =
        "Assistant-only SFT supervises the selected response positions; EOS is assumed already counted in the response here. Loss masking does not automatically establish a correct attention mask.";
    } else {
      view.innerHTML =
        '<div class="metrics">' +
        metric(
          (a() / 100).toFixed(3),
          "accuracy, invalids counted as failures",
        ) +
        metric((a() / (100 - b())).toFixed(3), "if invalids are excluded") +
        "</div>";
      explanation.textContent =
        "There are 100 evaluation prompts; correct plus invalid never exceeds 100 in these controls. Dropping invalid responses changes the denominator and can inflate a headline score without improving any answer.";
    }
    const graphics:Record<string,()=>string> = {
      graph: () => networkGraphic() + computationGraphic(),
      shapes: () => networkGraphic(b()),
      softmax: () => barsGraphic(softmax([2,1,0],a()),['A','B','C'],'Next-token probabilities'),
      attention: () => attentionGraphic(a()),
      gradient: () => computationGraphic() + barsGraphic([(a()-1)/b(),(1-a())/b()],['Correct','Other'],'Signed logit gradient contributions'),
      bandit: () => policyGraphic(a()),
      curation: () => corpusGraphic([1000,1000*(1-a()/100),1000*(1-a()/100)*(1-b()/100)]),
      batch: () => workersGraphic(a(),b()),
      mask: () => maskGraphic(a(),b()),
      evaluation: () => barsGraphic([a(),100-a()-b(),b()],['Correct','Incorrect','Invalid'],'100 evaluation responses'),
    };
    if(graphics[kind])view.insertAdjacentHTML('afterbegin',graphics[kind]());
  }
  draw();
}
