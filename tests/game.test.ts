import assert from "node:assert/strict";
import { test } from "node:test";
import { episodeScore, starsFor, recordRun, freshGame, totalXP, levelFor, streak, dayKey, validateGame, MAX_EPISODE_SCORE, LEVELS } from "../src/site/game.ts";
import { episodes, episodesByModule } from "../src/site/episodes.ts";

const modules = episodesByModule();
const DAY = 86400000;

test("a perfect run scores the maximum and earns three stars", () => {
  const score = episodeScore(true, ["first", "first"]);
  assert.equal(score, MAX_EPISODE_SCORE);
  assert.equal(starsFor(score), 3);
  assert.equal(starsFor(episodeScore(false, ["missed", "missed"])), 1);
  assert.equal(starsFor(episodeScore(true, ["first", "assisted"])), 2);
});

test("replays only add XP when they beat the previous best", () => {
  let { game, gained } = recordRun(freshGame(), "e01", 50, modules);
  assert.equal(gained, 50);
  ({ game, gained } = recordRun(game, "e01", 40, modules));
  assert.equal(gained, 0);
  assert.equal(game.episodes.e01.best, 50);
  ({ game, gained } = recordRun(game, "e01", 90, modules));
  assert.equal(gained, 40);
  assert.equal(totalXP(game), 90);
});

test("badges unlock once, in response to the run that earns them", () => {
  let r = recordRun(freshGame(), "e01", 90, modules);
  assert.deepEqual(r.newBadges, ["first", "perfect"]);
  r = recordRun(r.game, "e02", 50, modules);
  assert.deepEqual(r.newBadges, ["season"]);
  r = recordRun(r.game, "e02", 90, modules);
  assert.deepEqual(r.newBadges, []);
});

test("finishing every episode reaches the top level and the full-series badge", () => {
  let game = freshGame();
  for (const e of episodes) game = recordRun(game, e.id, MAX_EPISODE_SCORE, modules).game;
  assert.ok(game.badges.includes("all"));
  assert.equal(levelFor(totalXP(game)).index, LEVELS.length - 1);
});

test("level boundaries are inclusive and report progress to the next", () => {
  assert.equal(levelFor(0).name, "Random init");
  assert.equal(levelFor(89).index, 0);
  assert.equal(levelFor(90).index, 1);
  assert.equal(levelFor(180).fraction, 0.5);
});

test("streak counts consecutive local days, allowing today to be unplayed", () => {
  const now = new Date(2026, 9, 23, 12).getTime();
  const days = [dayKey(now - DAY), dayKey(now - 2 * DAY), dayKey(now - 4 * DAY)];
  assert.equal(streak(days, now), 2);
  assert.equal(streak([...days, dayKey(now)], now), 3);
  assert.equal(streak([dayKey(now - 3 * DAY)], now), 0);
});

test("validation drops unknown or out-of-range records and recomputes stars", () => {
  const known = new Set(["e01", "e02"]);
  const game = validateGame({ version: 1, episodes: { e01: { best: 90, stars: 1, time: 1 }, e02: { best: 9999, time: 1 }, x: { best: 10, time: 1 } }, days: ["2026-10-23", "bad"], badges: ["first", "fake"] }, known);
  assert.deepEqual(Object.keys(game.episodes), ["e01"]);
  assert.equal(game.episodes.e01.stars, 3);
  assert.deepEqual(game.days, ["2026-10-23"]);
  assert.deepEqual(game.badges, ["first"]);
  assert.throws(() => validateGame({ version: 2 }, known));
});

test("progress backups carry the arcade record", async () => {
  const { isLearningDataKey } = await import("../src/site/progress-backup.ts");
  const { GAME_KEY } = await import("../src/site/game.ts");
  assert.ok(isLearningDataKey(GAME_KEY));
});
