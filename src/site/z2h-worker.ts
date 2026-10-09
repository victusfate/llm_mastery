// Sandbox for learner-edited code samples.
//
// The samples run in a worker so an accidental infinite loop costs a terminated
// worker rather than a frozen page, and so nothing the snippet does can touch
// the page, saved notes, or storage. The worker holds no credentials and makes
// no network requests; the whole track is static files.

import * as numerics from "./z2h-numerics.ts";
import * as data from "./z2h-data.ts";

export interface SandboxRequest {
  code: string;
}

export interface SandboxResponse {
  ok: boolean;
  lines: string[];
  returned?: string;
  /** A rectangular numeric matrix found in the returned value, if any. */
  matrix?: number[][];
  error?: string;
}

const MAX_ITEMS = 24;
const MAX_DEPTH = 2;
/** Widest matrix worth drawing as a heatmap in a cell. */
const MAX_MATRIX_SIDE = 64;

/** Readable preview of any value, with arrays and depth truncated. */
function preview(value: unknown, depth = 0): string {
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(6)));
  if (typeof value === "string") return depth === 0 ? value : JSON.stringify(value);
  if (typeof value === "boolean" || value === null || value === undefined) return String(value);
  if (typeof value === "function") return "[function]";
  if (depth > MAX_DEPTH) return Array.isArray(value) ? "[…]" : "{…}";
  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ITEMS).map((item) => preview(item, depth + 1));
    if (value.length > MAX_ITEMS) items.push(`…${value.length - MAX_ITEMS} more`);
    return `[${items.join(", ")}]`;
  }
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  return `{ ${Object.entries(value as Record<string, unknown>)
    .slice(0, MAX_ITEMS)
    .map(([key, item]) => `${key}: ${preview(item, depth + 1)}`)
    .join(", ")} }`;
}

const isNumberRow = (row: unknown): row is number[] =>
  Array.isArray(row) && row.length > 0 && row.every((value) => typeof value === "number" && Number.isFinite(value));

/** Find a matrix to draw: the value itself, or the first matrix-valued field. */
function findMatrix(value: unknown): number[][] | undefined {
  if (Array.isArray(value) && value.length > 0 && value.length <= MAX_MATRIX_SIDE && value.every(isNumberRow)) {
    const width = (value[0] as number[]).length;
    if (width <= MAX_MATRIX_SIDE && value.every((row) => (row as number[]).length === width)) return value as number[][];
  }
  if (value && typeof value === "object" && !Array.isArray(value))
    for (const item of Object.values(value as Record<string, unknown>)) {
      const found = findMatrix(item);
      if (found) return found;
    }
  return undefined;
}

/** Run one snippet with the numerics, the datasets, and a print function. */
export function runSample(code: string): SandboxResponse {
  const lines: string[] = [];
  const print = (...args: unknown[]) => {
    if (lines.length < 200) lines.push(args.map((value) => preview(value)).join(" "));
  };
  try {
    // eslint-disable-next-line no-new-func -- the snippet is the learner's own
    // code, running in a worker with no page, storage, or network access.
    const sample = new Function("z2h", "data", "print", `"use strict";\n${code}`);
    const returned = sample(numerics, data, print);
    return { ok: true, lines, returned: returned === undefined ? undefined : preview(returned), matrix: findMatrix(returned) };
  } catch (error) {
    return { ok: false, lines, error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) };
  }
}

// Installed only when this module is loaded as a worker; the tests import
// runSample directly and must not acquire a message handler. The constructor is
// looked up rather than named, because the project's lib targets the DOM.
const workerScope = (globalThis as { WorkerGlobalScope?: new () => unknown }).WorkerGlobalScope;
if (workerScope && self instanceof workerScope) {
  self.onmessage = (event: MessageEvent<SandboxRequest>) => {
    (self as unknown as Worker).postMessage(runSample(event.data.code));
  };
}
