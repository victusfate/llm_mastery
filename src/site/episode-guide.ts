import { episodeLearning } from './episode-learning.ts';
import { initialValues, type Episode, type Values, type Scene } from './episodes.ts';
import { escapeHTML as esc } from './engine.ts';
import { mountTutor } from './tutor.ts';
import { mountPrimer, resourcesHTML } from './concept-primer.ts';
import { modules } from './content.ts';

// Reuse the episode's actual scene calculation for every miniature picture.
function snapshot(scene: Scene): string {
  return (scene.bars ?? []).map(bar => `<div class="learning-bar"><span>${esc(bar.label)} · ${esc(bar.text ?? bar.value.toFixed(2))}</span><div><i class="tone-${bar.tone ?? 'on'}" style="width:${Math.max(0, Math.min(100, bar.value / bar.max * 100))}%"></i></div></div>`).join('') +
    (scene.tokens?.length ? `<div class="learning-tokens" style="--cols:${scene.columns ?? 16}" role="img" aria-label="${esc(scene.readouts.map(([v, label]) => `${label}: ${v}`).join('; '))}">${scene.tokens.map(tone => `<span class="tok tone-${tone}"></span>`).join('')}</div>` : '');
}

/** A persistent, optional learning space: never changes answers, scores or progress. */
export function mountEpisodeGuide(root: HTMLElement, e: Episode, experiment: (values: Values) => void) {
  const guide = episodeLearning[e.id];
  let current = initialValues(e), selected = 0;
  const baseline = e.scene(initialValues(e)).readouts;
  const readouts = (v: Values) => e.scene(v).readouts.map(([value, label]) => `${label}: ${value}`).join('\n');
  root.innerHTML = `<div class="row between"><h2 id="learning-title" tabindex="-1">Down the rabbit hole 🐇</h2><span class="small">Explore at your pace · no timer</span></div>
    <p>${esc(guide.why)}</p>
    <h3>Click a definition</h3><div class="learning-terms">${guide.terms.map(([term, meaning]) => `<details><summary>${esc(term)}</summary><p>${esc(meaning)}</p></details>`).join('')}</div>
    <section class="flow-explorer" aria-label="Interactive data flow"><h3>Follow the data</h3><p class="small">Click a stop. Move the challenge controls to change the numbers.</p>
      <div class="flow-stops" role="group" aria-label="Data flow steps">${['Inputs', 'Transform', 'Result'].map((label, i) => `<button type="button" data-flow="${i}" aria-pressed="${i === 0}" aria-controls="flow-detail"><span>${i + 1}</span>${label}${i < 2 ? ' →' : ''}</button>`).join('')}</div>
      <div id="flow-detail" class="flow-detail" role="status" aria-live="polite" aria-atomic="true"></div>
      <div class="row"><button type="button" data-flow-back>← Previous stop</button><button type="button" data-flow-next>Next stop →</button></div>
    </section>
    <details class="learning-example"><summary>Show a worked example</summary><p>${esc(guide.example)}</p></details>
    <details class="learning-hint"><summary>Stuck? Give me a nudge</summary><p>${esc(guide.hint)}</p></details>
    <details><summary>A trap to watch for</summary><p>${esc(guide.misconception)}</p></details>
    <section class="twist-lab"><h3>What if…?</h3><p>Predict what changes, then try it. This demo earns no challenge XP; use the controls for your own attempt.</p><div class="row"><button type="button" data-twist>${esc(guide.twist.label)} ⚡</button><button type="button" data-reset-twist>Reset experiment</button></div><p data-twist-notice role="status"></p>
      <div class="twist-comparison" hidden><div><strong>Starting result</strong>${snapshot(e.scene(initialValues(e)))}<pre>${esc(baseline.map(([v, label]) => `${label}: ${v}`).join('\n'))}</pre></div><div><strong>Now</strong><div data-live-picture></div><pre data-live-result></pre></div></div>
    </section>
    <details class="episode-primer"><summary>More definitions, visual examples & related ideas</summary><div data-primer></div></details>
    <details><summary>Read, watch, or build something deeper</summary><p><a href="submodule.html?unit=${e.deeper}" target="_blank" rel="noopener">Open the full lesson for this episode ↗</a> · <a href="read.html?doc=docs/12-concepts.md" target="_blank" rel="noopener">Concept field guide ↗</a></p>${e.source ? `<p><a href="${esc(e.source.href)}" target="_blank" rel="noopener">${esc(e.source.label)} ↗</a></p>` : ''}${resourcesHTML(modules[e.module].file)}</details>
    <div data-episode-tutor></div>`;
  const detail = root.querySelector<HTMLElement>('#flow-detail')!;
  const stops = [...root.querySelectorAll<HTMLButtonElement>('[data-flow]')];
  function paint() {
    stops.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
    const inputs = e.controls.map(c => `${c.label}: ${c.toggle ? (current[c.id] ? 'on' : 'off') : current[c.id]}`).join('\n');
    detail.innerHTML = selected === 0 ? `<strong>1 · What goes in?</strong><pre>${esc(inputs)}</pre>`
      : selected === 1 ? `<strong>2 · What happens to it?</strong><p>${esc(guide.transform)}</p>`
      : `<strong>3 · What comes out?</strong>${snapshot(e.scene(current))}<pre>${esc(readouts(current))}</pre>`;
    root.querySelector<HTMLButtonElement>('[data-flow-back]')!.disabled = selected === 0;
    root.querySelector<HTMLButtonElement>('[data-flow-next]')!.disabled = selected === 2;
    root.querySelector<HTMLElement>('[data-live-picture]')!.innerHTML = snapshot(e.scene(current));
    root.querySelector<HTMLElement>('[data-live-result]')!.textContent = readouts(current);
  }
  stops.forEach((button, i) => button.onclick = () => { selected = i; paint(); });
  root.querySelector<HTMLButtonElement>('[data-flow-back]')!.onclick = () => { selected--; paint(); };
  root.querySelector<HTMLButtonElement>('[data-flow-next]')!.onclick = () => { selected++; paint(); };
  function demo(v: Values, notice: string) {
    experiment(v);
    current = { ...v };
    root.querySelector<HTMLElement>('[data-twist-notice]')!.textContent = notice;
    root.querySelector<HTMLElement>('.twist-comparison')!.hidden = false;
    selected = 2;
    paint();
  }
  root.querySelector<HTMLButtonElement>('[data-twist]')!.onclick = () => demo({ ...initialValues(e), ...guide.twist.values }, guide.twist.notice);
  root.querySelector<HTMLButtonElement>('[data-reset-twist]')!.onclick = () => demo(initialValues(e), 'Back at the starting settings. Try your own prediction with the controls.');
  const primer = root.querySelector<HTMLDetailsElement>('.episode-primer')!;
  let loaded = false;
  primer.addEventListener('toggle', () => {
    if (primer.open && !loaded) { loaded = true; mountPrimer(root.querySelector('[data-primer]'), modules[e.module].file); }
  });
  mountTutor(root.querySelector('[data-episode-tutor]'), () => ({
    title: `${e.title} — ${guide.terms.map(([term]) => term).join(', ')}`,
    text: `Episode: ${e.id}\nGoal: ${e.goal}\nIdea: ${e.idea}\nData flow: ${guide.transform}\nWorked example: ${guide.example}\nCaution: ${guide.misconception}\nCurrent settings: ${JSON.stringify(current)}\nCurrent result:\n${readouts(current)}\nCurrent exercise:\n${document.querySelector('#stage')?.textContent}\nFull lesson: ${new URL(`submodule.html?unit=${e.deeper}`, location.href).href}\n${e.source ? `Primary source: ${e.source.href}` : ''}\nHelp me get unstuck with one hint, a small visual analogy, and a prediction to try in the live controls. Wait before giving the solution.`,
  }));
  // The reusable tutor owns provider settings, editable prompt, and clipboard fallback.
  root.querySelector('[data-episode-tutor] summary')!.textContent = 'Ask your LLM about this experiment ↗';
  paint();
  return { update(values: Values) { current = { ...values }; paint(); } };
}
