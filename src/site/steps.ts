import { submodules } from "./submodules.ts";
import { labs } from "./labs.ts";

export interface Step {
  id: string;
  label: string;
  kind: "overview" | "read" | "lab" | "prove";
  href?: string;
}

// Each module becomes a short list of completable chunks: one overview,
// one step per submodule page, one per lab, and one unaided check.
export function moduleSteps(index: number): Step[] {
  const steps: Step[] = [
    { id: "overview", label: "Read the module overview", kind: "overview" },
  ];
  for (const unit of submodules.filter((u) => u.module === index))
    steps.push({
      id: `read-${unit.id}`,
      label: unit.title,
      kind: "read",
      href: `submodule.html?unit=${unit.id}`,
    });
  const seen = new Set<string>();
  for (const lab of labs.filter((l) => l.module === index)) {
    if (seen.has(lab.id)) continue;
    seen.add(lab.id);
    steps.push({
      id: `lab-${lab.id}`,
      label: lab.title,
      kind: "lab",
      href: `lab.html?lab=${lab.id}`,
    });
  }
  steps.push({ id: "prove", label: "Pass one check unaided", kind: "prove" });
  return steps;
}

// Completed chunks are stored separately from quiz scheduling so a backup
// import of one never corrupts the other. Values are completion timestamps.
export type StepRecord = Record<string, number>;

const KEY = "llm-training-steps-v1";

export function stepKey(module: number, id: string): string {
  return `${module}-${id}`;
}

export function loadSteps(): StepRecord {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return sanitizeSteps(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function sanitizeSteps(data: unknown): StepRecord {
  const out: StepRecord = {};
  if (!data || typeof data !== "object") return out;
  for (const [key, value] of Object.entries(data as Record<string, unknown>))
    if (/^\d+-(overview|prove|read-[\d-]+|lab-[\d-]+)$/.test(key))
      if (Number.isFinite(value) && (value as number) > 0)
        out[key] = value as number;
  return out;
}

export function saveSteps(record: StepRecord): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function isDone(record: StepRecord, module: number, id: string): boolean {
  return Boolean(record[stepKey(module, id)]);
}

export function stepProgress(record: StepRecord, module: number) {
  const steps = moduleSteps(module);
  const done = steps.filter((s) => isDone(record, module, s.id)).length;
  return { done, total: steps.length };
}

export function totalProgress(record: StepRecord) {
  let done = 0,
    total = 0;
  for (const module of new Set(submodules.map((u) => u.module))) {
    const progress = stepProgress(record, module);
    done += progress.done;
    total += progress.total;
  }
  return { done, total };
}

export function toggleStep(
  record: StepRecord,
  module: number,
  id: string,
  done: boolean,
  now = Date.now(),
): StepRecord {
  const next = { ...record };
  if (done) next[stepKey(module, id)] = now;
  else delete next[stepKey(module, id)];
  return next;
}

// The first incomplete chunk, so the interface can always offer one next action.
export function nextStep(record: StepRecord, module: number): Step | null {
  return moduleSteps(module).find((s) => !isDone(record, module, s.id)) || null;
}
