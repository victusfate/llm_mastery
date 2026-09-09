import { descentGraphic, barsGraphic, attentionGraphic, policyGraphic } from './graphics.ts';
import { createProgressBackup, validateProgressBackup, restoreProgressBackup } from "./progress-backup.ts";
import { renderCoach, confidenceFeedback } from "./study-coach.ts";
import { mountPrimer } from "./concept-primer.ts";
import { submodules } from "./submodules.ts";
import { startExplorer } from "./explorer.ts";
import { setupLecture } from "./lecture.ts";
import { labs } from "./labs.ts";
import { modules } from "./content.ts";
import {
  softmax,
  numericCorrect,
  scheduleReview,
  freshState,
  validateState,
  escapeHTML as esc,
  markdown,
  makeQuestion,
} from "./engine.ts";
import { element as $ } from "./dom.ts";
const KEY = "llm-training-lab-v1";
const lecture = setupLecture();
let state = freshState(),
  question,
  checked = false,
  revealed = false,
  variant = 0,
  guideRequest = 0;
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = validateState(JSON.parse(raw));
} catch {
  $("storage-status").textContent =
    "Saved progress could not be read. Starting a new in-memory session; import a backup if available.";
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    $("storage-status").textContent =
      "Browser storage unavailable. Export a backup before closing.";
  }
}
function stats() {
  renderCoach($("study-coach"), state);
  const records = Object.values(state.reviews),
    due = records.filter((r) => r.due <= Date.now()).length;
  $("stats").innerHTML =
    `<div><strong>${records.length}/20</strong><span>concepts attempted</span></div><div><strong>${due}</strong><span>due for review</span></div>`;
}
function selectModule(index) {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  state.selected = index;
  renderCoach($("study-coach"), state);
  save();
  const m = modules[index];
  mountPrimer($("concept-primer"), m.file);
  document.querySelectorAll<HTMLElement>("#modules button").forEach((b, i) => {
    b.classList.toggle("active", i === index);
    b.setAttribute("aria-current", i === index ? "step" : "false");
  });
  $("week").textContent = `MODULE ${index + 1} / LEARN AT YOUR PACE`;
  for (const key of [
    "title",
    "concept",
    "summary",
    "prediction",
    "lab",
    "defense",
  ])
    $(key).textContent = m[key];
  $("notes").value = state.notes[index] || "";
  $("note-status").textContent = "";
  $("video").replaceChildren();
  $("media").replaceChildren();
  if (m.video) {
    const b = document.createElement("button");
    b.textContent = "Open recorded lecture";
    b.onclick = () => {
      $("video").innerHTML =
        `<iframe title="Stanford CS336 lecture" src="https://www.youtube-nocookie.com/embed/${m.video}" allow="fullscreen; picture-in-picture" allowfullscreen></iframe><p class="small">External media. If playback is blocked, <a href="https://www.youtube.com/watch?v=${m.video}" target="_blank" rel="noopener">open on YouTube</a>.</p>`;
    };
    $("media").append(b);
  } else {
    const a = document.createElement("a");
    a.href = "../docs/06-resources.md";
    a.target = "_blank";
    a.textContent = "Readings & media ↗";
    $("media").append(a);
  }
  loadGuide(index);
  lecture.select(index, m);
  renderLabs(index);
  const url = new URL(location.href);
  url.searchParams.set("module", String(index + 1));
  history.replaceState(null, "", url);

  $("visual-choice").value = m.visual;
  visualControls();
  newQuestion();
  stats();
}
modules.forEach((m, i) => {
  const b = document.createElement("button");
  b.innerHTML = `<span>${String(i + 1).padStart(2, "0")}</span>${esc(m.title)}`;
  b.onclick = () => selectModule(i);
  $("modules").append(b);
});
function tab(name) {
  for (const b of document.querySelectorAll<HTMLElement>("[data-tab]")) {
    const active = b.dataset.tab === name;
    b.setAttribute("aria-selected", String(active));
    b.tabIndex = active ? 0 : -1;
    $(b.dataset.tab).hidden = !active;
  }
}
for (const b of document.querySelectorAll<HTMLElement>("[data-tab]")) {
  b.onclick = () => tab(b.dataset.tab);
  b.onkeydown = (e) => {
    const names = ["learn", "test", "build"];
    let i = names.indexOf(b.dataset.tab);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      i = (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
      tab(names[i]);
      $(`tab-${names[i]}`).focus();
    }
  };
}
async function loadGuide(index) {
  const id = ++guideRequest;
  const path = `../modules/${modules[index].file}.md`;
  $("guide-body").textContent = "Loading the full module…";
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (id === guideRequest) {
      const overview =
        index === 0
          ? text.split("## 1.")[0]
          : text
              .split("## Concepts to explain")[0]
              .split("## Select one question")[0];
      const units = submodules.filter((u) => u.module === index);
      $("guide-body").innerHTML =
        markdown(overview, new URL(path, location.href)) +
        "<h2>Follow the submodules</h2><p>Each page contains detailed text, a short lecture clip, an interactive example, and links to its dedicated labs.</p>" +
        units
          .map(
            (u) =>
              `<a class="lab-link" href="submodule.html?unit=${u.id}"><span>PART ${u.id.split("-")[1]}</span><strong>${esc(u.title)}</strong><span>Read, listen, try →</span></a>`,
          )
          .join("") +
        '<details class="complete-reference"><summary>Read the complete module reference on this page</summary>' +
        markdown(text, new URL(path, location.href)) +
        "</details>";
    }
  } catch (e) {
    if (id === guideRequest)
      $("guide-body").textContent =
        `Could not load the module: ${e.message}. Check the local server.`;
  }
}
function renderLabs(index) {
  $("lab-index").innerHTML =
    "<h2>Open a dedicated lab</h2><p>Each lab has its own guidance, troubleshooting, and evidence record.</p>" +
    labs
      .filter((l) => l.module === index)
      .map(
        (l) =>
          `<a class="lab-link" href="lab.html?lab=${l.id}"><span>LAB ${l.id}</span><strong>${esc(l.title)}</strong><span>Open walkthrough →</span></a>`,
      )
      .join("");
}

function newQuestion(forceVariant = undefined) {
  variant = forceVariant ?? 1 - variant;
  question = makeQuestion(state.selected, variant);
  checked = false;
  revealed = false;
  $("question").textContent = question.prompt;
  $("answer").value = "";
  $("answer").disabled = false;
  $("assisted").checked = false;
  $("feedback").textContent = "";
  if(document.querySelector("#confidence-feedback"))document.querySelector("#confidence-feedback").textContent="";
  if(document.querySelector<HTMLSelectElement>("#confidence"))document.querySelector<HTMLSelectElement>("#confidence").value="medium";
  $("check").disabled = false;
  $("reveal").disabled = false;
}
$("next-question").onclick = () => newQuestion();
$("answer-form").onsubmit = (e) => {
  e.preventDefault();
  if (checked) return;
  const answer = $("answer").value;
  if (!answer.trim() || !Number.isFinite(Number(answer))) {
    $("feedback").textContent =
      "Enter a finite number, using decimals rather than a fraction.";
    return;
  }
  const correct = numericCorrect(answer, question.expected, question.tolerance),
    assisted = revealed || $("assisted").checked;
  checked = true;
  state.reviews[question.key] = scheduleReview(
    state.reviews[question.key],
    correct,
    assisted,
  );
  state.history.push({
    time: Date.now(),
    module: state.selected,
    question: question.prompt,
    answer,
    correct,
    assisted,
  });
  const confidence=document.querySelector<HTMLSelectElement>('#confidence').value;
  document.querySelector('#confidence-feedback').textContent=confidenceFeedback(confidence,correct,assisted);
  state.history[state.history.length-1].confidence=confidence;
  state.history = state.history.slice(-20000);
  save();
  stats();
  $("check").disabled = true;
  $("answer").disabled = true;
  $("feedback").className = correct ? "success" : "failure";
  $("feedback").textContent =
    `${correct ? "Correct." : "Not yet."} Expected ${Number(question.expected.toFixed(5))}. ${question.explanation} ${assisted ? "Assisted attempt: revisit in 10 minutes." : "Saved as concept practice; practical gate unchanged."}`;
};
$("reveal").onclick = () => {
  revealed = true;
  $("assisted").checked = true;
  $("feedback").className = "";
  $("feedback").textContent =
    `${question.explanation} Expected ${Number(question.expected.toFixed(5))}. Submit to record an assisted attempt, then try a fresh problem.`;
};
$("review").onclick = () => {
  const now = Date.now();
  const entries = Object.entries(state.reviews)
    .filter(([, r]) => r.due <= now)
    .sort((a, b) => a[1].due - b[1].due);
  let key = entries[0]?.[0];
  if (!key)
    for (let i = 0; i < 10 && !key; i++)
      for (let j = 0; j < 2; j++)
        if (!state.reviews[`${i}-${j}`]) {
          key = `${i}-${j}`;
          break;
        }
  if (!key)
    key =
      Object.entries(state.reviews).sort(
        (a, b) => a[1].due - b[1].due,
      )[0]?.[0] || "0-0";
  const [m, v] = key.split("-").map(Number);
  selectModule(m);
  newQuestion(v);
  tab("test");
  $("answer").focus();
};
$("notes").oninput = () => {
  state.notes[state.selected] = $("notes").value;
  save();
  $("note-status").textContent = "Saved locally · unreviewed evidence";
};
$("save-note").onclick = () => {
  state.notes[state.selected] = $("notes").value;
  save();
  $("note-status").textContent =
    "Saved locally · unreviewed evidence. Export for a durable backup.";
};
$("tutor-prompt").onclick = async () => {
  const m = modules[state.selected];
  const prompt = `We are working on LLM Training Mastery, ${m.title}. Read modules/${m.file}.md and assessments/01-mastery.md. Review my evidence, ask me to predict and explain the mechanism, then give a fresh independent transfer task. Distinguish agent-assisted building from my own understanding. Do not award a gate from quiz scores alone.\n\n${$("notes").value}`;
  try {
    await navigator.clipboard.writeText(prompt);
    $("note-status").textContent = "Tutor handoff copied.";
  } catch {
    $("note-status").textContent =
      "Clipboard unavailable. Copy your note and the current module name manually.";
  }
};
function download(name, type, text) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function backupText() {
  try { return JSON.stringify(createProgressBackup(state, localStorage), null, 2); }
  catch { $("storage-status").textContent = "Full backup could not read browser storage. Check site storage permissions before retrying."; return null; }
}
$("export").onclick = () => {
  const snapshot = backupText();
  if (!snapshot) return;
  download(
    "training-lab-progress.json",
    "application/json",
    snapshot,
  );
  const lines = [
    "# LLM Training Lab — learning record",
    `Exported: ${new Date().toISOString()}`,
    "",
    "Concept practice only. Practical gates and notes remain unreviewed.",
    "",
  ];
  for (const [i, note] of Object.entries(state.notes)) {
    lines.push(`## ${modules[Number(i)].title}`, note, "");
  }
  lines.push("## Concept attempts", "");
  for (const r of state.history)
    lines.push(
      `- ${new Date(r.time).toISOString()} · ${modules[r.module].title} · ${r.correct ? "correct" : "incorrect"} · ${r.assisted ? "assisted" : "unaided"}`,
      `  - Question: ${r.question}`,
      `  - Answer: ${r.answer}`,
    );
  download("training-lab-record.md", "text/markdown", lines.join("\n"));
  $("storage-status").textContent =
    "Export requested: Full JSON backup (including lab/submodule notes and hardware) and Markdown tutor record. If the browser blocks multiple downloads, use the backup button below.";
  if (!$("backup-only")) {
    const b = document.createElement("button");
    b.id = "backup-only";
    b.textContent = "Download JSON backup";
    b.onclick = () => {
      const snapshot = backupText();
      if (!snapshot) return;
      download(
        "training-lab-progress.json",
        "application/json",
        JSON.stringify(createProgressBackup(state, localStorage), null, 2),
      );
    };
    $("storage-status").after(b);
  }
};
$("import").onchange = async (e) => {
  const file = (e.target as HTMLInputElement).files[0];
  if (!file) return;
  try {
    if (file.size > 5000000) throw new Error("Backup exceeds 5 MB");
    const backup = validateProgressBackup(JSON.parse(await file.text()));
    const next = backup.state;
    if (
      !confirm(
        "Replace this browser’s progress with the selected backup? Export first if you need to keep both.",
      )
    )
      return;
    restoreProgressBackup(backup, localStorage);
    state = next;
    selectModule(state.selected);
    $("storage-status").textContent =
      "Backup imported. Evidence notes remain unreviewed.";
  } catch (error) {
    $("storage-status").textContent =
      `Import failed: ${error.message}. Existing progress kept.`;
  } finally {
    (e.target as HTMLInputElement).value = "";
  }
};
$("speak").onclick = () => lecture.play();
$("stop-speech").onclick = () => lecture.stop();
document.addEventListener("conceptlookup", () => {
  if (!$("test").hidden && !checked) {
    revealed = true;
    $("assisted").checked = true;
  }
});
function visualControls() {
  const kind = $("visual-choice").value;
  const options = {
    softmax: ["Temperature", 0.2, 3, 0.1, 1],
    attention: ["Highlighted query position", 0, 7, 1, 3],
    descent: ["Learning rate", 0.05, 2.5, 0.05, 0.4],
    bandit: ["Probability of action A", 0.01, 0.99, 0.01, 0.5],
  };
  const [label, min, max, step, value] = options[kind];
  $("controls").innerHTML =
    `<label for="slider">${label}: <output id="slider-value">${value}</output></label><input id="slider" type="range" min="${min}" max="${max}" step="${step}" value="${value}">${kind === "attention" ? '<label class="check"><input id="causal" type="checkbox" checked> Causal mask enabled</label>' : ""}`;
  $("slider").oninput = drawVisual;
  if ($("causal")) $("causal").onchange = drawVisual;
  drawVisual();
}
function drawVisual() {
  const kind = $("visual-choice").value,
    v = Number($("slider").value);
  $("slider-value").value = String(v);
  if (kind === "softmax") {
    const logits = [2, 1, 0],
      p = softmax(logits, v);
    $("visual").innerHTML =
      '<div class="bars">' +
      p
        .map(
          (x, i) =>
            `<div class="bar-row"><span>logit ${logits[i]}</span><div class="bar-track"><div class="bar-fill" style="width:${x * 100}%"></div></div><span>${(x * 100).toFixed(1)}%</span></div>`,
        )
        .join("") +
      "</div>";
    $("visual-explanation").textContent =
      `Entropy: ${(-p.reduce((s, x) => s + x * Math.log(x), 0)).toFixed(3)} nats. Raising temperature flattens this fixed distribution; it does not teach the model anything. Probabilities sum to ${p.reduce((a, b) => a + b, 0).toFixed(3)}.`;
  } else if (kind === "attention") {
    const causal = $("causal").checked;
    $("visual").innerHTML =
      '<div class="heatmap" role="img" aria-label="Eight by eight allowed-attention mask; rows are queries, columns are keys">' +
      Array.from({ length: 64 }, (_, i) => {
        const row = Math.floor(i / 8),
          col = i % 8,
          on = !causal || col <= row;
        return `<div class="cell ${on ? "on" : ""} ${row === v ? "selected" : ""}">${row},${col}</div>`;
      }).join("") +
      "</div>";
    $("visual-explanation").textContent =
      `Rows are queries; columns are keys. Highlighted row ${v} can access ${causal ? v + 1 : 8} keys. These are allowed positions, not learned attention weights. ${causal ? "Future positions are blocked." : "Future information is visible: unsuitable for ordinary next-token training."}`;
  } else if (kind === "descent") {
    let x = 2;
    const xs = [x];
    for (let i = 0; i < 18; i++) {
      x = (1 - v) * x;
      xs.push(x);
    }
    $("visual").innerHTML = descentGraphic(v);
    $("visual-explanation").textContent =
      `For L(x)=x²/2, x_next=(1−learning_rate)x. Final x=${x.toFixed(4)}. Converges for 0<rate<2, oscillates without decay at 2, diverges above 2. This toy curvature does not specify an LLM learning rate.`;
  } else {
    const reward = 1 + 2 * v,
      grad = 2 * v * (1 - v);
    $("visual").innerHTML =
      `<div class="metrics"><div class="metric"><strong>${reward.toFixed(3)}</strong><span>expected reward</span></div><div class="metric"><strong>${grad.toFixed(3)}</strong><span>d expected reward / d logit</span></div><div class="metric"><strong>${(v * 100).toFixed(0)}%</strong><span>probability of A</span></div></div>`;
    $("visual-explanation").textContent =
      "A earns 3; B earns 1. J=3p+1(1−p). With p=sigmoid(z), dJ/dz=2p(1−p). Higher expected reward does not always mean a larger gradient. Compare this exact value with a sampled estimator in the lab.";
  }
  if(kind === 'softmax')$("visual").insertAdjacentHTML('afterbegin', barsGraphic(softmax([2,1,0],v),['A','B','C'],'Next-token probabilities'));
  if(kind === 'attention')$("visual").insertAdjacentHTML('afterbegin', attentionGraphic(8,v,$("causal").checked));
  if(kind === 'bandit')$("visual").insertAdjacentHTML('afterbegin', policyGraphic(v));
}
$("visual-choice").onchange = visualControls;
tab("learn");
const requestedModule = Number(
  new URL(location.href).searchParams.get("module"),
);
selectModule(
  Number.isInteger(requestedModule) &&
    requestedModule >= 1 &&
    requestedModule <= 10
    ? requestedModule - 1
    : state.selected,
);
startExplorer();

const mode = new URL(location.href).searchParams.get("mode");
if (["learn", "test", "build"].includes(mode)) tab(mode);
