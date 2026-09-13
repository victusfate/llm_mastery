// Live code cells.
//
// A guide marks a block runnable by fencing it as ```run. The Markdown stays
// plain text everywhere else — on GitHub, in the reader, in a diff — and this
// module upgrades those blocks in the rendered page into editable cells that
// execute in the sandbox worker, so an example sits beside the paragraph that
// explains it rather than in a panel at the end of the page.

import { escapeHTML as esc } from "./engine.ts";
import { matrixGraphic } from "./z2h-visuals.ts";
import type { SandboxResponse } from "./z2h-worker.ts";

const TIMEOUT = 5000;

/**
 * One worker per run, terminated on completion or timeout, so a snippet that
 * never returns costs a worker rather than the page.
 */
export function runInWorker(code: string, timeout = TIMEOUT): Promise<SandboxResponse> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("z2h-worker.mjs", import.meta.url), { type: "module" });
    } catch (error) {
      resolve({ ok: false, lines: [], error: `This browser refused to start the sandbox worker: ${String(error)}` });
      return;
    }
    const finish = (response: SandboxResponse) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(response);
    };
    const timer = setTimeout(
      () => finish({ ok: false, lines: [], error: `Stopped after ${timeout / 1000} seconds. Reduce the work, or check for a loop that never ends.` }),
      timeout,
    );
    worker.onmessage = (event: MessageEvent<SandboxResponse>) => finish(event.data);
    worker.onerror = (event) => finish({ ok: false, lines: [], error: event.message || "The sandbox worker failed to load." });
    worker.postMessage({ code });
  });
}

export interface LiveCellOptions {
  code: string;
  /** Stable key for remembering edits within this browser session. */
  storageKey?: string;
  label?: string;
  /** Run once on mount, for a cell whose output is the point of the paragraph. */
  autorun?: boolean;
}

/** Replace `host` with an editable, runnable cell seeded from `options.code`. */
export function mountLiveCell(host: HTMLElement, options: LiveCellOptions): void {
  const cell = document.createElement("div");
  cell.className = "live-cell";
  const editorId = `live-${Math.random().toString(36).slice(2, 9)}`;

  const label = document.createElement("label");
  label.className = "small";
  label.htmlFor = editorId;
  label.textContent = options.label ?? "Editable example — Ctrl/Cmd + Enter runs it";

  const editor = document.createElement("textarea");
  editor.id = editorId;
  editor.className = "code-editor";
  editor.spellcheck = false;
  editor.rows = Math.min(22, Math.max(4, options.code.split("\n").length + 1));
  let stored: string | null = null;
  try {
    stored = options.storageKey ? sessionStorage.getItem(options.storageKey) : null;
  } catch {}
  editor.value = stored ?? options.code;

  const run = document.createElement("button");
  run.type = "button";
  run.className = "primary";
  run.textContent = "Run";
  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Reset";
  const controls = document.createElement("div");
  controls.className = "row";
  controls.append(run, reset);

  const output = document.createElement("pre");
  output.className = "live-output";
  output.tabIndex = 0;
  output.setAttribute("aria-live", "polite");
  const figure = document.createElement("div");
  const status = document.createElement("p");
  status.className = "small";
  status.setAttribute("role", "status");

  async function execute() {
    run.disabled = true;
    status.textContent = "Running in a background worker…";
    try {
      if (options.storageKey) sessionStorage.setItem(options.storageKey, editor.value);
    } catch {}
    const started = performance.now();
    const result = await runInWorker(editor.value);
    const lines = [...result.lines];
    if (result.returned !== undefined) lines.push(`→ ${result.returned}`);
    if (result.error) lines.push(result.error);
    output.textContent = lines.join("\n") || "No output. Add a print(...) call or return a value.";
    output.classList.toggle("failure", !result.ok);
    figure.innerHTML = result.matrix
      ? matrixGraphic(result.matrix, {
          caption: "Matrix returned by this cell",
          description: `A ${result.matrix.length} by ${result.matrix[0].length} matrix returned by the code above; brighter cells are larger values.`,
        })
      : "";
    status.textContent = `${result.ok ? "Finished" : "Stopped"} in ${Math.round(performance.now() - started)} ms, in a worker with no network or storage access.`;
    run.disabled = false;
  }

  run.onclick = execute;
  reset.onclick = () => {
    editor.value = options.code;
    output.textContent = "";
    output.classList.remove("failure");
    figure.innerHTML = "";
    status.textContent = "Restored the original example.";
  };
  editor.onkeydown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      execute();
    }
  };

  cell.append(label, editor, controls, output, figure, status);
  host.replaceWith(cell);
  if (options.autorun) execute();
}

/**
 * Upgrade every ```run block inside `container`. Blocks that never render (an
 * unsupported browser, a failed script) stay readable as ordinary code.
 */
export function upgradeLiveBlocks(container: HTMLElement, keyPrefix: string): number {
  const blocks = [...container.querySelectorAll<HTMLElement>("pre > code.language-run")];
  blocks.forEach((block, index) => {
    mountLiveCell(block.parentElement, {
      code: block.textContent.replace(/\n+$/, ""),
      storageKey: `${keyPrefix}-${index}`,
      label: `Editable example ${index + 1} of ${blocks.length} — Ctrl/Cmd + Enter runs it`,
    });
  });
  return blocks.length;
}

/** Runnable blocks in a Markdown source, for tests and tooling. */
export function liveBlocksOf(markdown: string): string[] {
  return [...markdown.matchAll(/^```run\n([\s\S]*?)^```/gm)].map((match) => match[1].replace(/\n+$/, ""));
}

// The escaping helper is re-exported so a caller rendering its own cell labels
// does not need a second import for the same utility.
export { esc };
