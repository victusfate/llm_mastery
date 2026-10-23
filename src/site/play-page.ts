// Arcade page: bite-sized episodes with a live challenge, one short idea,
// two quick checks, and a reward screen. Scores live in their own storage key;
// numerical answers also feed the workbench's spaced-review schedule.

import { episodes, episodesByModule, initialValues, type Episode, type Scene, type Values, type Control } from "./episodes.ts";
import { GAME_KEY, SCORE, BADGES, MAX_EPISODE_SCORE, MAX_STARS, freshGame, validateGame, recordRun, episodeScore, checkPoints, totalXP, levelFor, streak, starsFor, type GameState, type CheckResult } from "./game.ts";
import { validateState, freshState, recordAttempt, numericCorrect, makeQuestion, PROGRESS_KEY, escapeHTML as esc } from "./engine.ts";
import { metric } from "./readout.ts";
import { loadSteps, saveSteps, toggleStep, isDone } from "./steps.ts";
import { modules } from "./content.ts";

const byModule = episodesByModule();
const episodeById = new Map(episodes.map((e) => [e.id, e]));
const known = new Set(episodeById.keys());
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document) => root.querySelector<T>(selector)!;

let game: GameState = freshGame();
try {
  const raw = localStorage.getItem(GAME_KEY);
  if (raw) game = validateGame(JSON.parse(raw), known);
} catch {
  /* Unreadable record: start fresh in memory rather than block play. */
}
function saveGame() {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify(game));
  } catch {
    toast("Browser storage is unavailable, so this run won't be saved.");
  }
}

// ---------- HUD and map ----------

function stars(n: number, max = MAX_STARS) {
  return `<span class="stars" aria-label="${n} of ${max} stars">${"★".repeat(n)}<span class="dim">${"★".repeat(max - n)}</span></span>`;
}

function renderHud() {
  const xp = totalXP(game), level = levelFor(xp), days = streak(game.days);
  const starCount = Object.values(game.episodes).reduce((s, e) => s + e.stars, 0);
  $("#hud").innerHTML = `
    <div class="hud-level"><span class="hud-badge">Lv ${level.index + 1}</span><div><strong>${esc(level.name)}</strong>
      <div class="xp-track" role="progressbar" aria-label="Progress to next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(level.fraction * 100)}"><div class="xp-fill" style="width:${level.fraction * 100}%"></div></div>
      <span class="small">${xp} XP${level.next ? ` · ${level.next - xp} to next level` : " · top level"}</span></div></div>
    <div class="hud-stat"><strong>${days}</strong><span>day streak</span></div>
    <div class="hud-stat"><strong>${starCount}<span class="of">/${episodes.length * MAX_STARS}</span></strong><span>stars</span></div>
    <div class="hud-stat"><strong>${Object.keys(game.episodes).length}<span class="of">/${episodes.length}</span></strong><span>episodes</span></div>`;
}

/** First unplayed episode, else the first without full stars. */
const upNextEpisode = () => episodes.find((e) => !game.episodes[e.id]) ?? episodes.find((e) => game.episodes[e.id].stars < MAX_STARS);

function tileHTML(e: Episode, upNext?: Episode) {
  const result = game.episodes[e.id], isNext = upNext === e;
  const status = result ? stars(result.stars) : `<span class="ep-new">${isNext ? "Up next" : "New"}</span>`;
  return `<button class="episode-tile ${result ? "played" : ""} ${isNext ? "up-next" : ""}" data-episode="${e.id}"><span class="ep-num">EP ${e.id.slice(1)}</span><strong>${esc(e.title)}</strong><span class="ep-hook">${esc(e.hook)}</span>${status}</button>`;
}

function renderMap() {
  const upNext = upNextEpisode();
  $("#continue").textContent = upNext ? `▶ ${game.episodes[upNext.id] ? "Go for 3 stars" : "Play"}: ${upNext.title}` : "▶ Replay any episode";
  $("#continue").onclick = () => start(upNext ?? episodes[0]);
  $("#seasons").innerHTML = modules
    .map((m, i) => {
      const ids = byModule.get(i) ?? [];
      const cleared = ids.every((id) => game.episodes[id]);
      return `<section class="season ${cleared ? "cleared" : ""}"><p class="eyebrow">SEASON ${String(i + 1).padStart(2, "0")}${cleared ? " · CLEAR" : ""}</p><h2>${esc(m.title)}</h2><div class="episode-row">${ids.map((id) => tileHTML(episodeById.get(id)!, upNext)).join("")}</div></section>`;
    })
    .join("");
  for (const tile of document.querySelectorAll<HTMLButtonElement>("[data-episode]"))
    tile.onclick = () => start(episodeById.get(tile.dataset.episode!)!);
  $("#badge-shelf").innerHTML =
    `<p class="eyebrow">BADGES · ${game.badges.length}/${BADGES.length}</p><div class="badges">` +
    BADGES.map((b) => `<div class="badge ${game.badges.includes(b.id) ? "earned" : ""}"><strong>${esc(b.label)}</strong><span>${esc(b.detail)}</span></div>`).join("") +
    "</div>";
  renderHud();
}

// ---------- Animated scene ----------

// Scenes update existing elements in place so CSS transitions animate every
// change: bars grow, token cells fade between states.
function paintScene(root: HTMLElement, scene: Scene) {
  const barBox = $(".scene-bars", root), tokenBox = $(".scene-tokens", root), readBox = $(".scene-readouts", root);
  const bars = scene.bars ?? [];
  if (barBox.children.length !== bars.length)
    barBox.innerHTML = bars.map(() => `<div class="sbar"><span class="sbar-label"></span><div class="sbar-track"><div class="sbar-fill"></div></div><span class="sbar-value"></span></div>`).join("");
  bars.forEach((b, i) => {
    const row = barBox.children[i] as HTMLElement;
    $(".sbar-label", row).textContent = b.label;
    $(".sbar-value", row).textContent = b.text ?? b.value.toFixed(2);
    const fill = $(".sbar-fill", row);
    fill.style.width = `${Math.max(0, Math.min(1, b.value / b.max)) * 100}%`;
    fill.className = `sbar-fill tone-${b.tone ?? "on"}`;
  });
  const tokens = scene.tokens ?? [];
  tokenBox.hidden = !tokens.length;
  tokenBox.style.setProperty("--cols", String(scene.columns ?? 16));
  while (tokenBox.children.length > tokens.length) tokenBox.lastElementChild!.remove();
  while (tokenBox.children.length < tokens.length) tokenBox.append(Object.assign(document.createElement("span"), { className: "tok enter" }));
  tokens.forEach((t, i) => ((tokenBox.children[i] as HTMLElement).className = `tok tone-${t}`));
  readBox.innerHTML = scene.readouts.map(([v, label]) => metric(v, label)).join("");
}

const sceneShell = () => `<div class="scene"><div class="scene-bars"></div><div class="scene-tokens" role="img" aria-label="Token grid"></div><div class="metrics scene-readouts" aria-live="polite"></div></div>`;

function formatValue(c: Control, v: number) {
  if (c.toggle) return v ? "on" : "off";
  if (c.unit === "%") return `${Math.round(v * 100)}%`;
  return c.digits ? v.toFixed(c.digits) : String(v);
}

// Bumped whenever a card is replaced, so an animation never paints a card it doesn't own.
let cardToken = 0;

/** Sweep one control across its range and back, so the learner can watch cause and effect. */
function animateSweep(e: Episode, values: Values, apply: (v: Values) => void): Promise<void> {
  const c = e.controls.find((x) => x.id === e.sweep)!, start = values[c.id];
  const frames = c.toggle ? [1 - start, start, 1 - start, start] : [];
  if (!c.toggle) {
    const n = reducedMotion ? 6 : 48;
    for (let i = 0; i <= n; i++) frames.push(c.min + ((c.max - c.min) * i) / n);
    for (let i = n; i >= 0; i--) frames.push(c.min + ((c.max - c.min) * i) / n);
    frames.push(start);
  }
  const delay = c.toggle || reducedMotion ? 500 : 30;
  const token = cardToken;
  return new Promise((resolve) => {
    let i = 0;
    const tick = () => {
      if (token !== cardToken) return resolve();
      const raw = frames[i++];
      apply({ ...values, [c.id]: c.toggle ? raw : Math.round(raw / c.step) * c.step });
      if (i < frames.length) setTimeout(tick, delay);
      else resolve();
    };
    tick();
  });
}

// ---------- Episode player ----------

interface Run { episode: Episode; step: number; cleared: boolean; checks: CheckResult[]; combo: number }
let run: Run | null = null;
const STEP_NAMES = ["Play", "Idea", "Check", "Calculate", "Reward"];

function start(e: Episode) {
  run = { episode: e, step: 0, cleared: false, checks: [], combo: 0 };
  $("#hub").hidden = true;
  $("#player").hidden = false;
  scrollTo({ top: 0 });
  showStep();
}

function leave() {
  run = null;
  cardToken++;
  $("#player").hidden = true;
  $("#hub").hidden = false;
  renderMap();
}

function advance() {
  run!.step++;
  showStep();
}

function showStep() {
  const r = run!, e = r.episode;
  $("#episode-label").textContent = `EP ${e.id.slice(1)} · ${e.title}`;
  $("#dots").innerHTML = STEP_NAMES.map((name, i) => `<li class="${i < r.step ? "done" : i === r.step ? "current" : ""}" ${i === r.step ? 'aria-current="step"' : ""}>${name}</li>`).join("");
  renderCombo();
  const stage = $("#stage");
  cardToken++;
  stage.classList.remove("card-in");
  void stage.offsetWidth; // restart the entry animation
  stage.classList.add("card-in");
  [playCard, ideaCard, choiceCard, numberCard, rewardCard][r.step](stage, e);
  stage.querySelector<HTMLElement>("h2")?.focus();
}

function playCard(stage: HTMLElement, e: Episode) {
  const values = initialValues(e);
  let sweeping = false;
  stage.innerHTML = `<p class="eyebrow">LIVE CHALLENGE · +${SCORE.challenge} XP</p><h2 tabindex="-1">${esc(e.hook)}</h2>
    <p class="goal"><span>Goal</span>${esc(e.goal)}</p>
    <div class="controls-grid">${e.controls
      .map((c) =>
        c.toggle
          ? `<label class="check control"><input type="checkbox" data-control="${c.id}" ${c.value ? "checked" : ""}> ${esc(c.label)}</label>`
          : `<label class="control"><span>${esc(c.label)}: <output data-out="${c.id}">${formatValue(c, c.value)}</output></span><input type="range" data-control="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}"></label>`,
      )
      .join("")}</div>
    ${sceneShell()}
    <p id="challenge-status" class="challenge-status" role="status">Move a control. The picture updates as you go.</p>
    <div class="row"><button id="watch">▶ Watch it move</button><button id="skip-challenge" class="quiet">Skip (no challenge XP)</button><button id="to-idea" class="primary" disabled>Next: the idea →</button></div>`;
  const apply = (v: Values) => {
    for (const c of e.controls) {
      const input = stage.querySelector<HTMLInputElement>(`[data-control="${c.id}"]`)!;
      if (c.toggle) input.checked = !!v[c.id];
      else input.value = String(v[c.id]);
      const out = stage.querySelector<HTMLOutputElement>(`[data-out="${c.id}"]`);
      if (out) out.value = formatValue(c, v[c.id]);
    }
    paintScene($(".scene", stage), e.scene(v));
  };
  const check = () => {
    if (sweeping || run?.cleared || !e.solved(values)) return;
    run!.cleared = true;
    $("#challenge-status").innerHTML = `<strong>Solved!</strong> ${esc(e.win)}`;
    $("#challenge-status").classList.add("won");
    $<HTMLButtonElement>("#to-idea").disabled = false;
    $("#skip-challenge").hidden = true;
    floatXP($("#to-idea"), SCORE.challenge);
    burst($(".scene", stage), 14);
  };
  for (const input of stage.querySelectorAll<HTMLInputElement>("[data-control]"))
    input.oninput = input.onchange = () => {
      values[input.dataset.control!] = input.type === "checkbox" ? Number(input.checked) : Number(input.value);
      apply(values);
      check();
    };
  $("#watch").onclick = async () => {
    sweeping = true;
    $<HTMLButtonElement>("#watch").disabled = true;
    $("#challenge-status").textContent = "Watch how the picture responds…";
    await animateSweep(e, values, apply);
    if (!stage.isConnected || !stage.contains($("#watch"))) return;
    apply(values);
    sweeping = false;
    $<HTMLButtonElement>("#watch").disabled = false;
    if (!run?.cleared) $("#challenge-status").textContent = "Your turn. Hit the goal.";
    check();
  };
  $("#skip-challenge").onclick = () => advance();
  $("#to-idea").onclick = () => advance();
  apply(values);
}

function ideaCard(stage: HTMLElement, e: Episode) {
  const values = initialValues(e);
  stage.innerHTML = `<p class="eyebrow">THE IDEA · 20 SECONDS</p><h2 tabindex="-1">${esc(e.title)}</h2><p class="idea">${esc(e.idea)}</p>${sceneShell()}
    <p class="small">The animation replays what you just played with.</p>
    <div class="row"><button id="replay">↻ Replay animation</button><button id="to-check" class="primary">Quick check →</button></div>`;
  const apply = (v: Values) => paintScene($(".scene", stage), e.scene(v));
  const play = () => animateSweep(e, values, apply);
  apply(values);
  $("#replay").onclick = play;
  $("#to-check").onclick = () => advance();
  const token = cardToken;
  setTimeout(() => token === cardToken && play(), 400);
}

const renderCombo = () => ($("#combo").textContent = run && run.combo >= 2 ? `Combo ×${run.combo}` : "");

function scoreCheck(result: CheckResult, anchor: HTMLElement) {
  const r = run!;
  r.checks.push(result);
  r.combo = result === "first" ? r.combo + 1 : 0;
  const points = checkPoints(result);
  if (points) floatXP(anchor, points);
  renderCombo();
}

function choiceCard(stage: HTMLElement, e: Episode) {
  let missed = false;
  stage.innerHTML = `<p class="eyebrow">QUICK CHECK · +${SCORE.firstTry} XP FIRST TRY</p><h2 tabindex="-1">${esc(e.choice.prompt)}</h2>
    <div class="choices">${e.choice.options.map((o, i) => `<button class="choice" data-choice="${i}">${esc(o)}</button>`).join("")}</div>
    <p id="choice-feedback" role="status"></p><div class="row"><button id="to-number" class="primary" hidden>Next →</button></div>`;
  for (const button of stage.querySelectorAll<HTMLButtonElement>("[data-choice]"))
    button.onclick = () => {
      const right = Number(button.dataset.choice) === e.choice.answer;
      if (!right) {
        missed = true;
        button.classList.add("wrong", "shake");
        button.disabled = true;
        $("#choice-feedback").textContent = "Not quite. Try another — one right answer remains.";
        return;
      }
      button.classList.add("right");
      for (const b of stage.querySelectorAll<HTMLButtonElement>("[data-choice]")) b.disabled = true;
      $("#choice-feedback").innerHTML = `<strong>${missed ? "Got there." : "Yes!"}</strong> ${esc(e.choice.why)}`;
      scoreCheck(missed ? "assisted" : "first", button);
      $("#to-number").hidden = false;
      $("#to-number").focus();
    };
  $("#to-number").onclick = () => advance();
}

/** Record a numeric answer in the workbench's review schedule, as the Retrieve tab does. */
function recordPractice(key: string, attempt: { module: number; question: string; answer: string; correct: boolean; assisted: boolean }) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const state = raw ? validateState(JSON.parse(raw)) : freshState();
    recordAttempt(state, key, { ...attempt, time: Date.now() });
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
    if (attempt.correct && !attempt.assisted) {
      const steps = loadSteps();
      if (!isDone(steps, attempt.module, "prove")) saveSteps(toggleStep(steps, attempt.module, "prove", true));
    }
  } catch {
    /* Practice still counts in the arcade if the workbench record is unreadable. */
  }
}

function numberCard(stage: HTMLElement, e: Episode) {
  const q = makeQuestion(e.module, e.variant);
  let hinted = false, done = false;
  stage.innerHTML = `<p class="eyebrow">CALCULATE · FRESH NUMBERS EACH TIME</p><h2 tabindex="-1">Your turn to compute</h2><p class="question">${esc(q.prompt)}</p>
    <form id="number-form" class="row"><label class="sr-only" for="number-answer">Numerical answer</label><input id="number-answer" inputmode="decimal" autocomplete="off" placeholder="Answer (decimals, ±0.01)" maxlength="40" required><button class="primary">Check</button></form>
    <div class="row"><button id="hint" class="quiet">Hint (fewer XP)</button></div>
    <p id="number-feedback" role="status"></p><div class="row"><button id="to-reward" class="primary" hidden>See your score →</button></div>`;
  $("#hint").onclick = () => {
    hinted = true;
    $<HTMLButtonElement>("#hint").disabled = true;
    $("#number-feedback").textContent = `Hint: ${q.explanation}`;
  };
  $<HTMLFormElement>("#number-form").onsubmit = (event) => {
    event.preventDefault();
    if (done) return;
    const input = $<HTMLInputElement>("#number-answer"), answer = input.value.trim();
    if (!Number.isFinite(Number(answer)) || !answer) {
      $("#number-feedback").textContent = "Enter a number, using decimals rather than a fraction.";
      return;
    }
    const correct = numericCorrect(answer, q.expected, q.tolerance);
    recordPractice(q.key, { module: e.module, question: q.prompt, answer, correct, assisted: hinted });
    if (!correct && !hinted) {
      hinted = true;
      input.classList.add("shake");
      setTimeout(() => input.classList.remove("shake"), 500);
      $("#number-feedback").innerHTML = `<strong>Not yet.</strong> Hint: ${esc(q.explanation)} Try once more.`;
      $<HTMLButtonElement>("#hint").disabled = true;
      return;
    }
    done = true;
    input.disabled = true;
    const expected = Number(q.expected.toFixed(5));
    $("#number-feedback").innerHTML = correct
      ? `<strong>${hinted ? "Correct, with a hint." : "Correct!"}</strong> ${esc(q.explanation)}`
      : `<strong>Expected ${expected}.</strong> ${esc(q.explanation)} It's back in your review queue.`;
    scoreCheck(correct ? (hinted ? "assisted" : "first") : "missed", input);
    $("#to-reward").hidden = false;
    $("#to-reward").focus();
  };
  $("#to-reward").onclick = () => advance();
  setTimeout(() => $("#number-answer").focus(), 50);
}

function rewardCard(stage: HTMLElement, e: Episode) {
  const r = run!, score = episodeScore(r.cleared, r.checks);
  const beforeXP = totalXP(game), beforeLevel = levelFor(beforeXP);
  const result = recordRun(game, e.id, score, byModule);
  game = result.game;
  saveGame();
  renderHud();
  const earned = starsFor(score), after = beforeXP + result.gained, level = levelFor(after);
  const next = episodes[episodes.indexOf(e) + 1];
  stage.innerHTML = `<p class="eyebrow">EPISODE COMPLETE</p><h2 tabindex="-1">${esc(e.takeaway)}</h2>
    <div class="reward-stars" aria-label="${earned} of ${MAX_STARS} stars">${Array.from({ length: MAX_STARS }, (_, i) => `<span class="big-star ${i < earned ? "lit" : ""}" style="--i:${i}">★</span>`).join("")}</div>
    <div class="metrics">${metric(`${score}/${MAX_EPISODE_SCORE}`, "run score")}<div class="metric"><strong id="xp-count">${beforeXP}</strong><span>total XP${result.gained ? ` (+${result.gained})` : " · beat your best to earn more"}</span></div>${metric(level.name, `level ${level.index + 1}`)}</div>
    <div class="xp-track big"><div class="xp-fill" id="reward-fill" style="width:${beforeLevel.index === level.index ? beforeLevel.fraction * 100 : 0}%"></div></div>
    <ul class="breakdown small"><li>Live challenge: ${r.cleared ? `+${SCORE.challenge}` : "skipped"}</li><li>Checks: ${r.checks.map((c) => `+${checkPoints(c)}`).join(", ")}</li><li>Finished: +${SCORE.finish}</li></ul>
    <p class="small">Go deeper: <a href="submodule.html?unit=${e.deeper}">the full lesson</a>${e.source ? ` · primary source: <a href="${e.source.href}" target="_blank" rel="noopener">${esc(e.source.label)} ↗</a>` : ""}</p>
    <div class="row">${next ? `<button id="next-episode" class="primary">Next: ${esc(next.title)} →</button>` : ""}<button id="replay-episode">Replay for stars</button><button id="to-map">Episode map</button></div>`;
  countUp($("#xp-count"), beforeXP, after);
  requestAnimationFrame(() => ($("#reward-fill").style.width = `${level.fraction * 100}%`));
  if (earned === 3) burst(stage, 40);
  if (result.levelUp) setTimeout(() => toast(`Level up! You reached ${level.name}.`, "level"), 700);
  result.newBadges.forEach((id, i) => setTimeout(() => toast(`Badge unlocked: ${BADGES.find((b) => b.id === id)!.label}`, "badge"), 1200 + i * 900));
  if (next) $("#next-episode").onclick = () => start(next);
  $("#replay-episode").onclick = () => start(e);
  $("#to-map").onclick = leave;
}

// ---------- Juice ----------

function floatXP(anchor: HTMLElement, points: number) {
  const box = anchor.getBoundingClientRect();
  const tag = Object.assign(document.createElement("span"), { className: "xp-float", textContent: `+${points} XP` });
  tag.setAttribute("aria-hidden", "true");
  tag.style.left = `${box.left + box.width / 2 + scrollX}px`;
  tag.style.top = `${box.top + scrollY}px`;
  document.body.append(tag);
  setTimeout(() => tag.remove(), 1200);
}

function burst(root: HTMLElement, count: number) {
  if (reducedMotion) return;
  const layer = Object.assign(document.createElement("div"), { className: "burst" });
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("i");
    bit.style.setProperty("--x", `${(Math.random() - 0.5) * 360}px`);
    bit.style.setProperty("--y", `${-80 - Math.random() * 220}px`);
    bit.style.setProperty("--r", `${Math.random() * 720}deg`);
    bit.style.setProperty("--h", String([212, 268, 140, 42][i % 4]));
    layer.append(bit);
  }
  root.append(layer);
  setTimeout(() => layer.remove(), 1400);
}

function countUp(el: HTMLElement, from: number, to: number) {
  if (reducedMotion || from === to) return void (el.textContent = String(to));
  const t0 = performance.now();
  const frame = (t: number) => {
    const k = Math.min(1, (t - t0) / 900);
    el.textContent = String(Math.round(from + (to - from) * (1 - (1 - k) ** 3)));
    if (k < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function toast(message: string, kind = "") {
  const t = Object.assign(document.createElement("div"), { className: `toast ${kind}`, textContent: message });
  $("#toasts").append(t);
  setTimeout(() => t.remove(), 3600);
}

$("#back").onclick = leave;
renderMap();
const requested = new URL(location.href).searchParams.get("episode");
const deepLink = episodes.find((e) => e.id === requested);
if (deepLink) start(deepLink);
