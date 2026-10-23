import assert from "node:assert/strict";
import { test } from "node:test";
import { episodes, initialValues, type Episode, type Values } from "../src/site/episodes.ts";
import { submodules } from "../src/site/submodules.ts";
import { makeQuestion } from "../src/site/engine.ts";

// Every reachable setting of an episode's controls, stepping exactly as the slider does.
function* grid(e: Episode): Generator<Values> {
  const axes = e.controls.map((c) => {
    const n = Math.round((c.max - c.min) / c.step);
    return Array.from({ length: n + 1 }, (_, i) => Number((c.min + i * c.step).toFixed(6)));
  });
  const walk = function* (i: number, acc: Values): Generator<Values> {
    if (i === axes.length) return yield { ...acc };
    for (const v of axes[i]) yield* walk(i + 1, { ...acc, [e.controls[i].id]: v });
  };
  yield* walk(0, {});
}

const sentences = (s: string) => s.split(/[.!?](?:\s|$)/).filter((x) => x.trim()).length;

test("twenty episodes, two per module, each tied to one engine question family", () => {
  assert.equal(episodes.length, 20);
  assert.equal(new Set(episodes.map((e) => e.id)).size, 20);
  for (let m = 0; m < 10; m++)
    assert.deepEqual(episodes.filter((e) => e.module === m).map((e) => e.variant).sort(), [0, 1]);
  for (const e of episodes) assert.ok(makeQuestion(e.module, e.variant).prompt);
});

test("copy stays bite-sized: one short idea, short options, no walls of terms", () => {
  for (const e of episodes) {
    assert.ok(e.hook.length <= 60, `${e.id} hook`);
    assert.ok(e.goal.length <= 120, `${e.id} goal`);
    assert.ok(e.idea.length <= 170 && sentences(e.idea) <= 3, `${e.id} idea: ${e.idea.length} chars`);
    assert.ok(e.takeaway.length <= 45, `${e.id} takeaway`);
    assert.ok(e.choice.options.every((o) => o.length <= 40), `${e.id} options`);
    assert.ok(e.choice.answer >= 0 && e.choice.answer < e.choice.options.length, `${e.id} answer`);
  }
});

test("every challenge starts unsolved and has at least one reachable solution", () => {
  for (const e of episodes) {
    assert.equal(e.solved(initialValues(e)), false, `${e.id} starts solved`);
    let solutions = 0;
    for (const v of grid(e)) if (e.solved(v)) solutions++;
    assert.ok(solutions > 0, `${e.id} has no reachable solution`);
  }
});

test("scenes stay finite and in range across every control setting", () => {
  for (const e of episodes)
    for (const v of grid(e)) {
      const s = e.scene(v);
      for (const b of s.bars ?? []) assert.ok(Number.isFinite(b.value) && b.max > 0, `${e.id} bar ${b.label}`);
      assert.ok((s.tokens ?? []).length <= 256, `${e.id} token count`);
      assert.ok(s.readouts.length > 0, `${e.id} readouts`);
    }
});

test("controls, sweeps and deeper links point at real things", () => {
  const units = new Set(submodules.map((u) => u.id));
  for (const e of episodes) {
    assert.ok(e.controls.some((c) => c.id === e.sweep), `${e.id} sweep`);
    assert.ok(units.has(e.deeper), `${e.id} deeper ${e.deeper}`);
    assert.equal(Number(e.deeper.slice(0, 2)) - 1, e.module, `${e.id} deeper module`);
    for (const c of e.controls) assert.ok(c.value >= c.min && c.value <= c.max, `${e.id} ${c.id} default`);
  }
});
