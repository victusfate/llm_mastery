// The Zero to Hero track page: one lecture at a time, with a study guide, an
// interactive panel, and an editable code sample that runs in a worker.

import { markdown, escapeHTML as esc } from "./engine.ts";
import { modules } from "./content.ts";
import { labs } from "./labs.ts";
import { lectures, type Lecture, type TrackLink } from "./z2h-track.ts";
import { ZERO_TO_HERO_NOTE_PREFIX } from "./progress-backup.ts";
import { mountPanel } from "./z2h-panel-mount.ts";
import { mountLiveCell, upgradeLiveBlocks } from "./z2h-live-code.ts";
import { startExplorer } from "./explorer.ts";
import { element as $ } from "./dom.ts";

const requested = new URL(location.href).searchParams.get("lecture");
const lecture = lectures.find((entry) => entry.id === requested) ?? lectures[0];

function link(item: TrackLink): string {
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
          `<li><a href="./?module=${entry.moduleIndex + 1}">Module ${entry.moduleIndex + 1}: ${esc(modules[entry.moduleIndex].title)}</a> — ${esc(entry.why)}</li>`,
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

const guideURL = (current: Lecture) => `../docs/zero-to-hero/${current.guide}`;

async function renderGuide(current: Lecture): Promise<void> {
  try {
    const response = await fetch(guideURL(current));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    $("guide-body").innerHTML = markdown(await response.text(), new URL(guideURL(current), location.href));
    upgradeLiveBlocks($("guide-body"), `llm-training-zero-to-hero-inline-${current.id}`);
  } catch (error) {
    $("guide-body").textContent = `The study guide could not load: ${(error as Error).message}. Open ${guideURL(current)} directly.`;
  }
}

function renderSampleCell(current: Lecture): void {
  $("sample-description").textContent = current.sample.description;
  mountLiveCell($("lecture-sample"), {
    code: current.sample.code,
    storageKey: `llm-training-zero-to-hero-code-${current.id}`,
    label: "The lecture's full example — Ctrl/Cmd + Enter runs it",
  });
}

function renderNotes(current: Lecture): void {
  const key = `${ZERO_TO_HERO_NOTE_PREFIX}${current.id}`;
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
  wireNoteExport(current, notes);
  wireTutorHandoff(current, notes);
}

/** Download the note as Markdown, so evidence can leave the browser. */
function wireNoteExport(current: Lecture, notes: HTMLTextAreaElement): void {
  $("lecture-export").onclick = () => {
    const text = `# Zero to Hero lecture ${current.number}: ${current.title}\n\nStatus: unreviewed\nExported: ${new Date().toISOString()}\n\n${notes.value}`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `zero-to-hero-${current.id}-record.md`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}

/** Copy a prompt that asks a tutor to test understanding, not accept the note. */
function wireTutorHandoff(current: Lecture, notes: HTMLTextAreaElement): void {
  $("lecture-tutor").onclick = async () => {
    const prompt = `I am working through lecture ${current.number} of the Zero to Hero series ("${current.title}") alongside docs/zero-to-hero/${current.guide}. Ask me to explain the mechanism from memory, then give me one fresh transfer task I have not seen. Do not accept my note as evidence of understanding.\n\nMy note:\n${notes.value}`;
    try {
      await navigator.clipboard.writeText(prompt);
      $("track-status").textContent = "Tutor handoff copied to the clipboard.";
    } catch {
      $("track-status").textContent = "Clipboard unavailable; copy your note manually.";
    }
  };
}

startExplorer();
renderNavigation(lecture);
renderHeader(lecture);
renderMapping(lecture);
renderSampleCell(lecture);
renderNotes(lecture);
mountPanel($("lecture-panel"), lecture.panel);
await renderGuide(lecture);
