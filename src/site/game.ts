// Arcade scoring. Pure functions so the rules are testable without a browser.
//
// XP is the sum of each episode's best score, so replaying cannot farm points:
// only a better run raises the total. Levels and badges describe arcade
// practice, never a module pass.

import { DAY } from "./engine.ts";

export const GAME_KEY = "llm-training-arcade-v1";
export const SCORE = { challenge: 30, firstTry: 20, assisted: 5, finish: 20 } as const;
export const MAX_EPISODE_SCORE = SCORE.challenge + 2 * SCORE.firstTry + SCORE.finish;
export const MAX_STARS = 3;
const TWO_STAR_SCORE = 70;
const MAX_DAYS = 400;

export type CheckResult = "first" | "assisted" | "missed";
export const checkPoints = (check: CheckResult) => (check === "first" ? SCORE.firstTry : check === "assisted" ? SCORE.assisted : 0);

export interface EpisodeResult { best: number; stars: number; time: number }
export interface GameState { version: 1; episodes: Record<string, EpisodeResult>; days: string[]; badges: string[] }

export const freshGame = (): GameState => ({ version: 1, episodes: {}, days: [], badges: [] });

export const episodeScore = (challengeCleared: boolean, checks: CheckResult[]) =>
  SCORE.finish + (challengeCleared ? SCORE.challenge : 0) + checks.reduce((sum, check) => sum + checkPoints(check), 0);

export const starsFor = (score: number) => 1 + Number(score >= TWO_STAR_SCORE) + Number(score >= MAX_EPISODE_SCORE);

export const totalXP = (game: GameState) => Object.values(game.episodes).reduce((sum, e) => sum + e.best, 0);

export const LEVELS: [number, string][] = [
  [0, "Random init"],
  [90, "Warmup"],
  [270, "Loss going down"],
  [540, "Generalizing"],
  [900, "Scaling up"],
  [1260, "Aligned"],
  [1620, "Reasoning"],
];

export function levelFor(xp: number) {
  let index = 0;
  while (index + 1 < LEVELS.length && xp >= LEVELS[index + 1][0]) index++;
  const [floor, name] = LEVELS[index];
  const next = LEVELS[index + 1]?.[0];
  return { index, name, floor, next, fraction: next ? (xp - floor) / (next - floor) : 1 };
}

/** Local calendar date, so a streak follows the learner's day rather than UTC. */
export function dayKey(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Consecutive played days ending today, or yesterday if today is not played yet. */
export function streak(days: string[], now = Date.now()): number {
  const played = new Set(days);
  let cursor = now;
  if (!played.has(dayKey(cursor))) cursor -= DAY;
  let count = 0;
  while (played.has(dayKey(cursor))) {
    count++;
    cursor -= DAY;
  }
  return count;
}

export interface Badge { id: string; label: string; detail: string; earned: (g: GameState, ctx: { modules: Map<number, string[]> }) => boolean }

export const BADGES: Badge[] = [
  { id: "first", label: "First spark", detail: "Finish any episode", earned: (g) => Object.keys(g.episodes).length >= 1 },
  { id: "perfect", label: "Clean run", detail: "Earn three stars on an episode", earned: (g) => Object.values(g.episodes).some((e) => e.stars === 3) },
  { id: "season", label: "Season clear", detail: "Finish every episode in one module", earned: (g, { modules }) => [...modules.values()].some((ids) => ids.every((id) => g.episodes[id])) },
  { id: "streak3", label: "Three-day habit", detail: "Play on three days in a row", earned: (g) => streak(g.days) >= 3 },
  { id: "half", label: "Halfway", detail: "Finish ten episodes", earned: (g) => Object.keys(g.episodes).length >= 10 },
  { id: "all", label: "Full series", detail: "Finish every episode", earned: (g, { modules }) => [...modules.values()].flat().every((id) => g.episodes[id]) },
];

/** Record a finished run. Returns the new state plus what changed, for the reward screen. */
export function recordRun(game: GameState, id: string, score: number, modules: Map<number, string[]>, now = Date.now()) {
  const before = totalXP(game);
  const previous = game.episodes[id];
  const best = Math.max(previous?.best ?? 0, score);
  const next: GameState = {
    ...game,
    episodes: { ...game.episodes, [id]: { best, stars: starsFor(best), time: now } },
    days: [...new Set([...game.days, dayKey(now)])].sort().slice(-MAX_DAYS),
  };
  const fresh = BADGES.filter((b) => !game.badges.includes(b.id) && b.earned(next, { modules })).map((b) => b.id);
  next.badges = [...game.badges, ...fresh];
  const after = totalXP(next);
  return { game: next, gained: after - before, newBadges: fresh, levelUp: levelFor(after).index > levelFor(before).index };
}

export function validateGame(input: unknown, knownIds: Set<string>): GameState {
  const data = input as Partial<GameState> | null;
  if (!data || data.version !== 1 || typeof data.episodes !== "object" || !Array.isArray(data.days) || !Array.isArray(data.badges))
    throw new Error("Unsupported arcade record");
  const game = freshGame();
  for (const [id, e] of Object.entries(data.episodes ?? {})) {
    if (!knownIds.has(id) || !e || !Number.isInteger(e.best) || e.best < 0 || e.best > MAX_EPISODE_SCORE || !Number.isFinite(e.time)) continue;
    game.episodes[id] = { best: e.best, stars: starsFor(e.best), time: e.time };
  }
  game.days = data.days.filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-MAX_DAYS);
  game.badges = data.badges.filter((b) => BADGES.some((badge) => badge.id === b));
  return game;
}
