import assert from "node:assert/strict";
import { test } from "node:test";
import {
  moduleSteps,
  sanitizeSteps,
  stepKey,
  stepProgress,
  totalProgress,
  toggleStep,
  nextStep,
  isDone,
  type StepRecord,
} from "../src/site/steps.ts";

test("moduleSteps decomposes each module into small tracked chunks", () => {
  const steps = moduleSteps(0);
  assert.equal(steps[0].kind, "overview");
  assert.equal(steps.at(-1)?.kind, "prove");
  const reads = steps.filter((s) => s.kind === "read");
  assert.equal(reads.length, 8); // module 01 has eight submodule pages
  const labs = steps.filter((s) => s.kind === "lab");
  assert.ok(labs.length >= 1);
  // Lab steps are unique even when a submodule references a lab twice.
  assert.equal(new Set(labs.map((s) => s.id)).size, labs.length);
  // Every chunk id is unique.
  assert.equal(new Set(steps.map((s) => s.id)).size, steps.length);
});

test("every module yields at least an overview and a prove chunk", () => {
  for (let module = 0; module < 10; module++) {
    const steps = moduleSteps(module);
    assert.ok(steps.length >= 2, `module ${module} too coarse`);
    assert.ok(steps.some((s) => s.kind === "read"), `module ${module} has no reading chunk`);
  }
});

test("stepProgress counts only completed chunks", () => {
  const steps = moduleSteps(0);
  let record: StepRecord = {};
  assert.deepEqual(stepProgress(record, 0), { done: 0, total: steps.length });
  record = toggleStep(record, 0, steps[0].id, true);
  record = toggleStep(record, 0, steps[1].id, true);
  assert.deepEqual(stepProgress(record, 0), { done: 2, total: steps.length });
  assert.equal(isDone(record, 0, steps[0].id), true);
  record = toggleStep(record, 0, steps[1].id, false);
  assert.deepEqual(stepProgress(record, 0), { done: 1, total: steps.length });
});

test("toggling stores completion timestamps under stable keys", () => {
  const record = toggleStep({}, 2, "read-02-01", true, 1234);
  assert.equal(record[stepKey(2, "read-02-01")], 1234);
  assert.deepEqual(toggleStep(record, 2, "read-02-01", false), {});
});

test("nextStep always offers the first incomplete chunk", () => {
  const steps = moduleSteps(0);
  let record: StepRecord = {};
  assert.equal(nextStep(record, 0)?.id, steps[0].id);
  for (const step of steps) record = toggleStep(record, 0, step.id, true);
  assert.equal(nextStep(record, 0), null);
});

test("totalProgress spans every module with submodules", () => {
  const record: StepRecord = {};
  const { total } = totalProgress(record);
  assert.ok(total > 50); // 35 submodules + overview/prove per module + labs
  const partial = toggleStep(record, 0, "overview", true);
  assert.deepEqual(totalProgress(partial).done, 1);
});

test("sanitizeSteps drops malformed records instead of throwing", () => {
  const clean = sanitizeSteps({
    "0-overview": 100,
    "1-prove": 0,
    "2-read-02-01": -5,
    "9-lab-09-02": 50,
    "bad key": 7,
    "1-snooze": 9,
    "0-read": 9,
    "x-overview": 9,
    junk: "hello",
  });
  assert.deepEqual(clean, { "0-overview": 100, "9-lab-09-02": 50 });
  assert.deepEqual(sanitizeSteps(null), {});
  assert.deepEqual(sanitizeSteps(undefined), {});
  assert.deepEqual(sanitizeSteps("corrupt"), {});
});