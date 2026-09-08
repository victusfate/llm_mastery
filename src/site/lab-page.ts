import { labs } from "./labs.ts";
import { markdown } from "./engine.ts";
import { startExplorer } from "./explorer.ts";
import { element as $ } from "./dom.ts";
const id = new URL(location.href).searchParams.get("lab");
const lab = labs.find((l) => l.id === id);
startExplorer();
if (!lab) {
  $("lab-title").textContent = "Lab not found";
  $("guide-body").textContent =
    "Choose a lab from its full module page. No arbitrary file paths are loaded.";
  $("lab-evidence").hidden = true;
} else {
  document.title = `Lab ${lab.id}: ${lab.title} · Training Lab`;
  $("lab-title").textContent = lab.title;
  $("lab-label").textContent = `MODULE ${lab.module + 1} / LAB ${lab.id}`;
  $("back-module").href = `./?module=${lab.module + 1}`;
  $("lab-source").href = lab.file;
  for (const item of labs.filter((l) => l.module === lab.module)) {
    const a = document.createElement("a");
    a.href = `lab.html?lab=${item.id}`;
    a.textContent = `${item.id} · ${item.title}`;
    if (item.id === lab.id) a.setAttribute("aria-current", "page");
    $("lab-navigation").append(a);
  }
  try {
    const r = await fetch(lab.file);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    $("guide-body").innerHTML = markdown(
      await r.text(),
      new URL(lab.file, location.href),
    );
  } catch (e) {
    $("guide-body").textContent =
      `Guidance could not load: ${e.message}. Try the Markdown source.`;
  }
  const key = `llm-training-lab-evidence-${lab.id}`;
  try {
    $("lab-notes").value = localStorage.getItem(key) || "";
  } catch {
    $("lab-status").textContent =
      "Storage is unavailable; export your record before closing.";
  }
  function save() {
    try {
      localStorage.setItem(key, $("lab-notes").value);
      $("lab-status").textContent = "Saved locally · unreviewed evidence";
    } catch {
      $("lab-status").textContent =
        "Could not save locally; export your record.";
    }
  }
  $("lab-notes").oninput = save;
  $("lab-notes").disabled = false;
  $("lab-save").onclick = save;
  $("lab-export").onclick = () => {
    const text = `# Lab ${lab.id}: ${lab.title}\n\nExported: ${new Date().toISOString()}\nStatus: unreviewed evidence\n\n${$("lab-notes").value}`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/markdown" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `lab-${lab.id}-record.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("lab-tutor").onclick = async () => {
    const prompt = `Review docs/labs/${lab.id}.md and my lab record below. Ask me to explain the mechanism, diagnose a fresh failure, and complete an independent transfer task. Do not infer a pass from a saved note.\n\n${$("lab-notes").value}`;
    try {
      await navigator.clipboard.writeText(prompt);
      $("lab-status").textContent = "Tutor handoff copied.";
    } catch {
      $("lab-status").textContent =
        "Clipboard unavailable. Copy your record and the lab ID manually.";
    }
  };
}
