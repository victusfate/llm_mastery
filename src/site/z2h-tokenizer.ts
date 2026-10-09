// Part of the Zero to Hero numerics. Every routine is an original implementation
// written for this course, deterministic under a seed so a number in a lesson
// can be asserted in a test. Import from ./z2h-numerics.ts, which re-exports the
// whole set as one API.

// Lecture 8 — byte-level byte-pair encoding

export interface Merge {
  id: number;
  pair: [number, number];
  count: number;
  piece: string;
}

export interface BPEModel {
  merges: Merge[];
  vocabularySize: number;
  ids: number[];
  bytes: number;
  compression: number;
}

/** A pair seen once is not a pattern, so merging starts at two. */
const MIN_PAIR_COUNT = 2;

const bytesOf = (text: string) => [...new TextEncoder().encode(text)];

function mergePass(ids: number[], pair: [number, number], replacement: number): number[] {
  const output: number[] = [];
  for (let i = 0; i < ids.length; ) {
    if (i + 1 < ids.length && ids[i] === pair[0] && ids[i + 1] === pair[1]) {
      output.push(replacement);
      i += 2;
    } else output.push(ids[i++]);
  }
  return output;
}

/** Repeatedly merge the most frequent adjacent pair, exactly as BPE prescribes. */
export function trainBPE(text: string, mergeCount = 20): BPEModel {
  let ids = bytesOf(text);
  const bytes = ids.length;
  const merges: Merge[] = [];
  const pieces = new Map<number, string>();
  const pieceOf = (id: number): string =>
    id < 256 ? new TextDecoder().decode(new Uint8Array([id])) : pieces.get(id) ?? `<${id}>`;
  for (let step = 0; step < mergeCount; step++) {
    const counts = new Map<string, number>();
    for (let i = 0; i + 1 < ids.length; i++) {
      const key = `${ids[i]},${ids[i + 1]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    let best = "";
    let bestCount = MIN_PAIR_COUNT - 1;
    for (const [key, count] of counts) if (count > bestCount) [best, bestCount] = [key, count];
    if (!best) break;
    const pair = best.split(",").map(Number) as [number, number];
    const id = 256 + merges.length;
    pieces.set(id, pieceOf(pair[0]) + pieceOf(pair[1]));
    merges.push({ id, pair, count: bestCount, piece: pieces.get(id) });
    ids = mergePass(ids, pair, id);
  }
  return {
    merges,
    vocabularySize: 256 + merges.length,
    ids,
    bytes,
    compression: ids.length ? bytes / ids.length : 1,
  };
}

export function encodeBPE(model: BPEModel, text: string): number[] {
  let ids = bytesOf(text);
  for (const merge of model.merges) ids = mergePass(ids, merge.pair, merge.id);
  return ids;
}

export function decodeBPE(model: BPEModel, ids: number[]): string {
  const expand = (id: number): number[] => {
    if (id < 256) return [id];
    const merge = model.merges.find((m) => m.id === id);
    return merge ? [...expand(merge.pair[0]), ...expand(merge.pair[1])] : [];
  };
  return new TextDecoder().decode(new Uint8Array(ids.flatMap(expand)));
}

/** Token strings for display: what the model actually sees, whitespace included. */
export function tokenPieces(model: BPEModel, ids: number[]): string[] {
  return ids.map((id) => decodeBPE(model, [id]));
}
