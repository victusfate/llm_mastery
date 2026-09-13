// Mounting for the Zero to Hero panels.
//
// Builds each panel's declared controls, then redraws on input — or on an
// explicit run for a panel whose computation is too slow to follow a slider.

import { escapeHTML as esc } from "./engine.ts";
import { panels, type PanelKind, type Values } from "./z2h-panels.ts";

/** Build the controls, draw once, and redraw on input or on an explicit run. */
export function mountPanel(root: HTMLElement, kind: PanelKind): void {
  const panel = panels[kind];
  const controls = document.createElement("div");
  controls.className = "panel-controls";
  const figures = document.createElement("div");
  const readout = document.createElement("div");
  const note = document.createElement("p");
  note.className = "muted";
  readout.setAttribute("aria-live", "polite");
  const values: Values = {};

  for (const spec of panel.controls) {
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
      if (!panel.manual) draw();
    });
    input.addEventListener("change", () => {
      values[spec.name] = read();
      if (!panel.manual) draw();
    });
    if (spec.kind === "checkbox") wrapper.prepend(input);
    else wrapper.append(document.createElement("br"), input);
    controls.append(wrapper);
  }

  const status = document.createElement("p");
  status.className = "small";
  status.setAttribute("role", "status");
  if (panel.manual) {
    const run = document.createElement("button");
    run.type = "button";
    run.className = "primary";
    run.textContent = panel.runLabel ?? "Run";
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
      const result = panel.render(values);
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
