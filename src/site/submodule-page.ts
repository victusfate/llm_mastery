import { mountPrimer } from "./concept-primer.ts";
import { modules } from "./content.ts";
import { submodules } from "./submodules.ts";
import { labs } from "./labs.ts";
import { markdown, escapeHTML as esc } from "./engine.ts";
import { mountSandbox } from "./sandbox.ts";
import { startExplorer } from "./explorer.ts";
import { element as $ } from "./dom.ts";
const id = new URL(location.href).searchParams.get("unit"),
  unit = submodules.find((u) => u.id === id);
startExplorer();
if (!unit) {
  $("unit-title").textContent = "Submodule not found";
  $("guide-body").textContent = "Choose a lesson from the module overview.";
  $("unit-audio").hidden = true;
} else {
  $("unit-title").textContent = unit.title;
  mountPrimer($("concept-primer"), modules[unit.module].file);
  document.title = `${unit.title} · Training Lab`;
  $("unit-label").textContent =
    `MODULE ${unit.module + 1} / SUBMODULE ${unit.id}`;
  $("back-module").href = `./?module=${unit.module + 1}`;
  $("unit-practice").href = `./?module=${unit.module + 1}&mode=test`;
  const siblings = submodules.filter((u) => u.module === unit.module),
    index = siblings.indexOf(unit);
  for (const sibling of siblings) {
    const a = document.createElement("a");
    a.href = `submodule.html?unit=${sibling.id}`;
    a.textContent = `${sibling.id} · ${sibling.title}`;
    if (sibling.id === id) a.setAttribute("aria-current", "page");
    $("unit-navigation").append(a);
  }
  $("unit-previous").href =
    index > 0
      ? `submodule.html?unit=${siblings[index - 1].id}`
      : `./?module=${unit.module + 1}`;
  $("unit-previous").textContent =
    index > 0 ? "← Previous lesson" : "← Module overview";
  $("unit-next").href =
    index < siblings.length - 1
      ? `submodule.html?unit=${siblings[index + 1].id}`
      : `./?module=${unit.module + 1}&mode=build`;
  $("unit-next").textContent =
    index < siblings.length - 1 ? "Next lesson →" : "Continue to labs →";
  const audio = $("unit-audio");
  audio.src = unit.audio;
  audio.onloadedmetadata = () => {
    $("audio-status").textContent =
      `${Math.floor(audio.duration / 60)}:${String(Math.round(audio.duration % 60)).padStart(2, "0")} · English (New Zealand) neural narration`;
  };
  audio.onerror = () => {
    $("audio-status").textContent =
      "The audio file did not load. Refresh after the deployment completes; the text and transcript remain available.";
  };
  try {
    const r = await fetch(unit.file);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    const [body, transcript] = text.split("## Spoken transcript\n");
    $("guide-body").innerHTML = markdown(
      body,
      new URL(unit.file, location.href),
    );
    $("transcript-body").innerHTML = markdown(
      transcript || "",
      new URL(unit.file, location.href),
    );
  } catch (e) {
    $("guide-body").textContent = `Lesson could not load: ${e.message}`;
  }
  mountSandbox($("unit-sandbox"), unit.visual);
  $("unit-labs").innerHTML =
    "<h2>Continue with a dedicated lab</h2>" +
    unit.labs
      .map((id) => labs.find((l) => l.id === id))
      .filter(Boolean)
      .map(
        (l) =>
          `<a class="lab-link" href="lab.html?lab=${l.id}"><span>LAB ${l.id}</span><strong>${esc(l.title)}</strong><span>Open →</span></a>`,
      )
      .join("");
  const key = `llm-training-submodule-${unit.id}`;
  try {
    $("unit-notes").value = localStorage.getItem(key) || "";
  } catch {}
  function save() {
    try {
      localStorage.setItem(key, $("unit-notes").value);
      $("unit-status").textContent = "Saved locally · unreviewed explanation";
    } catch {
      $("unit-status").textContent = "Storage unavailable; export the note.";
    }
  }
  $("unit-save").onclick = save;
  $("unit-notes").oninput = save;
  $("unit-export").onclick = () => {
    const text = `# Submodule ${unit.id}: ${unit.title}\n\nStatus: unreviewed\n\n${$("unit-notes").value}`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/markdown" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `submodule-${unit.id}-record.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}
