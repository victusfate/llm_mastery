// The Zero to Hero track page: one lecture at a time, with a study guide, an
// interactive panel, and an editable code sample that runs in a worker.

import { markdown, escapeHTML as esc } from "./engine.ts";
import { modules } from "./content.ts";
import { labs } from "./labs.ts";
import { lectures, findLecture, type Lecture } from "./z2h-track.ts";
import { mountWidget } from "./z2h-widgets.ts";
import { matrixGraphic } from "./z2h-visuals.ts";
import type { SandboxResponse } from "./z2h-worker.ts";
import { startExplorer } from "./explorer.ts";
import { element as $ } from "./dom.ts";

const SANDBOX_TIMEOUT = 5000;
const requested = new URL(location.href).searchParams.get("lecture");
const lecture = findLecture(requested) ?? lectures[0];
startExplorer();

function link(item: { label: string; url: string; note?: string }): string {
  return `<li><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.label)} ↗</a>${item.note ? ` <span class="small">— ${esc(item.note)}</span>` : ""}</li>`;
}

function renderNavigation(current: Lecture): void {
  for (const item of lectures) {
    const anchor = document.createElement("a");
    anchor.href = `zero-to-hero.html?lecture=${item.id}`;
    anchor.textContent = `${item.number}. ${item.title.replace(/:.*$/, "")}`;
    if (item.id === current.id) anchor.setAttribute("aria-current", "page");
    $("lecture-navigation").append(anchor);
  }
  const index = lectures.indexOf(current);
  const previous = lectures[index - 1];
  const next = lectures[index + 1];
  $("lecture-previous").href = previous ? `zero-to-hero.html?lecture=${previous.id}` : "../docs/18-zero-to-hero.md";
  $("lecture-previous").textContent = previous ? `← Lecture ${previous.number}` : "← Track overview";
  $("lecture-next").href = next ? `zero-to-hero.html?lecture=${next.id}` : "./";
  $("lecture-next").textContent = next ? `Lecture ${next.number} →` : "Back to the modules →";
}

function renderHeader(current: Lecture): void {
  document.title = `Zero to Hero ${current.number}: ${current.title} · Training Lab`;
  $("lecture-label").textContent = `ZERO TO HERO · LECTURE ${current.number} OF ${lectures.length}`;
  $("lecture-title").textContent = current.title;
  $("lecture-focus").textContent = current.focus;
  $("lecture-outcome").textContent = current.outcome;
  $("lecture-links").innerHTML = current.links.map(link).join("");
  const open = document.createElement("button");
  open.type = "button";
  open.className = "primary";
  open.textContent = "Open the lecture video";
  open.onclick = () => {
    $("lecture-video").innerHTML =
      `<iframe title="Neural Networks: Zero to Hero lecture ${current.number}" src="https://www.youtube-nocookie.com/embed/${esc(current.video)}" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>` +
      `<p class="small">External video published by Andrej Karpathy. It is linked, never copied or transcribed here. If playback is blocked, <a href="https://www.youtube.com/watch?v=${esc(current.video)}" target="_blank" rel="noopener">open it on YouTube</a>.</p>`;
    open.disabled = true;
  };
  $("lecture-open").replaceChildren(open);
}

function renderMapping(current: Lecture): void {
  $("lecture-mapping").innerHTML =
    "<h2>Where this sits in the course</h2>" +
    "<ul>" +
    current.courseModules
      .map(
        (entry) =>
          `<li><a href="./?module=${entry.module + 1}">Module ${entry.module + 1}: ${esc(modules[entry.module].title)}</a> — ${esc(entry.why)}</li>`,
      )
      .join("") +
    "</ul><h3>Labs that assess this material</h3>" +
    current.labs
      .map((id) => labs.find((item) => item.id === id))
      .filter(Boolean)
      .map(
        (item) =>
          `<a class="lab-link" href="lab.html?lab=${item.id}"><span>LAB ${item.id}</span><strong>${esc(item.title)}</strong><span>Open the walkthrough →</span></a>`,
      )
      .join("");
}

async function renderGuide(current: Lecture): Promise<void> {
  try {
    const response = await fetch(current.doc);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    $("guide-body").innerHTML = markdown(await response.text(), new URL(current.doc, location.href));
  } catch (error) {
    $("guide-body").textContent = `The study guide could not load: ${(error as Error).message}. Open ${current.doc} directly.`;
  }
}

/** One worker per run keeps a runaway snippet from blocking later attempts. */
function runInWorker(code: string): Promise<SandboxResponse> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("z2h-worker.mjs", import.meta.url), { type: "module" });
    } catch (error) {
      resolve({ ok: false, lines: [], error: `This browser refused to start the sandbox worker: ${String(error)}` });
      return;
    }
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ ok: false, lines: [], error: `Stopped after ${SANDBOX_TIMEOUT / 1000} seconds. Reduce the work, or check for a loop that never ends.` });
    }, SANDBOX_TIMEOUT);
    worker.onmessage = (event: MessageEvent<SandboxResponse>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, lines: [], error: event.message || "The sandbox worker failed to load." });
    };
    worker.postMessage({ code });
  });
}

function renderSandbox(current: Lecture): void {
  const editor = $("sample-code");
  const storageKey = `llm-training-zero-to-hero-code-${current.id}`;
  let saved: string | null = null;
  try {
    saved = sessionStorage.getItem(storageKey);
  } catch {}
  editor.value = saved ?? current.sample.code;
  editor.disabled = false;
  $("sample-description").textContent = current.sample.description;
  const output = $("sample-output");
  const figure = $("sample-figure");

  async function run() {
    $("sample-run").disabled = true;
    $("sample-status").textContent = "Running in a background worker…";
    try {
      sessionStorage.setItem(storageKey, editor.value);
    } catch {}
    const started = performance.now();
    const result = await runInWorker(editor.value);
    const elapsed = Math.round(performance.now() - started);
    const body = [...result.lines];
    if (result.returned !== undefined) body.push(`→ ${result.returned}`);
    if (result.error) body.push(result.error);
    output.textContent = body.join("\n") || "The sample produced no output. Add a print(...) call or return a value.";
    output.classList.toggle("failure", !result.ok);
    figure.innerHTML = result.matrix
      ? matrixGraphic(result.matrix, {
          caption: "Matrix returned by your code",
          description: `A ${result.matrix.length} by ${result.matrix[0].length} matrix returned by the sample; brighter cells are larger values.`,
        })
      : "";
    $("sample-status").textContent = `${result.ok ? "Finished" : "Stopped"} in ${elapsed} ms. Nothing left this page: the sandbox has no network or storage access.`;
    $("sample-run").disabled = false;
  }

  $("sample-run").onclick = run;
  $("sample-reset").onclick = () => {
    editor.value = current.sample.code;
    output.textContent = "";
    figure.innerHTML = "";
    $("sample-status").textContent = "Restored the original sample.";
  };
  editor.onkeydown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      run();
    }
  };
}

function renderNotes(current: Lecture): void {
  const key = `llm-training-zero-to-hero-${current.id}`;
  const notes = $("lecture-notes");
  try {
    notes.value = localStorage.getItem(key) || "";
  } catch {
    $("track-status").textContent = "Browser storage is unavailable; export your note before closing.";
  }
  notes.disabled = false;
  const save = () => {
    try {
      localStorage.setItem(key, notes.value);
      $("track-status").textContent = "Saved in this browser · unreviewed explanation";
    } catch {
      $("track-status").textContent = "Could not save locally; export the note instead.";
    }
  };
  notes.oninput = save;
  $("lecture-save").onclick = save;
  $("lecture-export").onclick = () => {
    const text = `# Zero to Hero lecture ${current.number}: ${current.title}\n\nStatus: unreviewed\nExported: ${new Date().toISOString()}\n\n${notes.value}`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `zero-to-hero-${current.id}-record.md`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("lecture-tutor").onclick = async () => {
    const prompt = `I am working through lecture ${current.number} of the Zero to Hero series ("${current.title}") alongside docs/zero-to-hero/${current.doc.split("/").pop()}. Ask me to explain the mechanism from memory, then give me one fresh transfer task I have not seen. Do not accept my note as evidence of understanding.\n\nMy note:\n${notes.value}`;
    try {
      await navigator.clipboard.writeText(prompt);
      $("track-status").textContent = "Tutor handoff copied to the clipboard.";
    } catch {
      $("track-status").textContent = "Clipboard unavailable; copy your note manually.";
    }
  };
}

renderNavigation(lecture);
renderHeader(lecture);
renderMapping(lecture);
renderSandbox(lecture);
renderNotes(lecture);
mountWidget($("lecture-widget"), lecture.widget);
await renderGuide(lecture);
