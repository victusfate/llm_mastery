import test from "node:test";
import assert from "node:assert/strict";
import {
  softmax,
  numericCorrect,
  scheduleReview,
  DAY,
  makeQuestion,
  validateState,
  freshState,
  markdown,
} from "../site/engine.mjs";
test("softmax is stable, normalized, shift invariant and flattens with temperature", () => {
  const p = softmax([1000, 999, 998]);
  assert.ok(p.every(Number.isFinite));
  assert.ok(Math.abs(p.reduce((a, b) => a + b) - 1) < 1e-12);
  assert.deepEqual(p, softmax([2, 1, 0]));
  assert.ok(softmax([2, 1, 0], 2)[0] < p[0]);
  assert.throws(() => softmax([1], 0));
});
test("numerical grading rejects empty, nonfinite and wrong answers", () => {
  for (const input of ["", " ", "Infinity", "abc", "1/2"])
    assert.equal(numericCorrect(input, 0.5), false);
  assert.equal(numericCorrect("0.5", 0.5), true);
  assert.equal(numericCorrect("0.9", 0.5), false);
});
test("review state distinguishes assistance and errors from unaided recall", () => {
  let r = scheduleReview(null, true, false, 100);
  assert.equal(r.due, 100 + DAY);
  assert.equal(r.streak, 1);
  const early = scheduleReview(r, true, false, 101);
  assert.equal(early.streak, 1);
  assert.equal(early.due, r.due);
  r = scheduleReview(r, true, false, 100 + DAY);
  assert.equal(r.streak, 2);
  assert.equal(r.due, 100 + 4 * DAY);
  r = scheduleReview(r, true, true, 200);
  assert.equal(r.streak, 0);
  assert.equal(r.due, 600200);
  r = scheduleReview(r, false, false, 300);
  assert.equal(r.correct, 3);
  assert.equal(r.attempts, 4);
});
test("all question families produce gradeable answers across random draws", () => {
  for (let m = 0; m < 10; m++)
    for (let v = 0; v < 2; v++)
      for (const draw of [0, 0.4, 0.99]) {
        const q = makeQuestion(m, v, () => draw);
        assert.ok(Number.isFinite(q.expected));
        assert.ok(numericCorrect(String(q.expected), q.expected));
        assert.equal(numericCorrect(String(q.expected + 1), q.expected), false);
      }
  assert.equal(makeQuestion(3, 0, () => 0).expected, 16);
  assert.equal(makeQuestion(4, 0, () => 0).expected, 12);
  assert.equal(makeQuestion(6, 1, () => 0).expected, 2 * 0.2 * 0.8);
});
test("backup schema validates records and rejects corrupt replacements", () => {
  const s = freshState();
  s.notes[0] = "<script>not executed</script>";
  s.reviews["0-0"] = scheduleReview(null, true, false, 0);
  assert.deepEqual(validateState(s), s);
  assert.throws(() => validateState({ ...s, selected: 99 }));
  assert.throws(() => validateState({ ...s, notes: { __bad: "x" } }));
  assert.throws(() => validateState({ ...s, history: [{}] }));
});
test("Markdown escapes raw HTML, rejects executable links and resolves relative links", () => {
  const out = markdown(
    "# Heading\n<script>alert(1)</script>\n[x](javascript:alert)\n[Module](../modules/a.md)\n```\n<img>\n```",
    "http://localhost/docs/one.md",
  );
  assert.ok(!out.includes("<script>"));
  assert.ok(!out.includes('href="javascript:'));
  assert.ok(out.includes("http://localhost/site/read.html?doc=modules%2Fa.md"));
  assert.ok(out.includes("&lt;img&gt;"));
});
