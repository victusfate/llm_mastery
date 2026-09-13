// Visualisations for the Zero to Hero track.
//
// These reuse the primitives and palette in graphics.ts so every diagram keeps
// the same offline-safe, contrast-checked presentation: essential styles travel
// inside the SVG, labels stay inside the viewBox, and each figure carries a
// title and description for screen readers.

import { frame, line, box, text } from "./graphics.ts";
import { SATURATION_THRESHOLD, type Trace } from "./z2h-numerics.ts";

/** Placeholder for an empty figure: an outlined plate rather than bare text. */
const emptyPlate = (message: string) =>
  `<rect x="70" y="70" width="460" height="140" class="blocked"/>` + text(300, 145, message);

const round = (value: number, digits = 3) =>
  !Number.isFinite(value) ? "∞" : Math.abs(value) >= 1000 || (Math.abs(value) < 0.001 && value !== 0)
    ? value.toExponential(1)
    : Number(value.toFixed(digits)).toString();

/** Computation graph of one expression: structure here, exact numbers in the table. */
export function traceGraphic(trace: Trace, limit = 15): string {
  const shown = trace.nodes.slice(0, limit);
  const depths = Math.max(...shown.map((n) => n.depth)) + 1;
  const columns = Array.from({ length: depths }, (_, d) => shown.filter((n) => n.depth === d));
  const rows = Math.max(...columns.map((c) => c.length));
  const position = new Map<number, [number, number]>();
  columns.forEach((column, d) => {
    const step = 520 / Math.max(1, depths);
    column.forEach((node, i) => {
      const spacing = Math.min(78, 210 / Math.max(1, column.length));
      position.set(node.id, [55 + step * d + step / 2, 70 + i * spacing - ((column.length - 1) * spacing) / 2 + 50]);
    });
  });
  let body = text(300, 25, `Forward left to right · ${shown.length} of ${trace.nodes.length} nodes`);
  for (const node of shown)
    for (const input of node.inputs) {
      const from = position.get(input);
      const to = position.get(node.id);
      if (from && to) body += line(from[0] + 38, from[1], to[0] - 38, to[1]);
    }
  for (const node of shown) {
    const [x, y] = position.get(node.id);
    const width = Math.min(76, 480 / Math.max(1, depths));
    body += box(x - width / 2, y - 17, width, 34, node.label || round(node.value, 2));
    if (rows <= 4) body += text(x, y + 34, round(node.value, 2));
  }
  return frame(
    "Expression computation graph",
    body,
    `Inputs and operations of the expression, ending in the output value ${round(trace.value)}. Gradients are listed in the table below the figure.`,
  );
}

export interface MatrixOptions {
  rowLabels?: string[];
  columnLabels?: string[];
  caption: string;
  description: string;
  /** Draw cells above the diagonal dark, for a causal mask. */
  mask?: boolean;
}

/**
 * Heatmap for count matrices and attention weights; opacity encodes magnitude.
 * The opacity floor keeps the faintest cell above the site's contrast gate, so
 * exact values belong in the table beside the figure rather than in the shading.
 */
export function matrixGraphic(values: number[][], options: MatrixOptions): string {
  const rows = values.length;
  const columns = values[0]?.length ?? 0;
  if (!rows || !columns) return frame(options.caption, emptyPlate("No data to show"), options.description);
  const peak = Math.max(...values.flat().map(Math.abs), 1e-12);
  const labelled = rows <= 12 && columns <= 12 && !!options.rowLabels;
  const size = Math.min(labelled ? 26 : 20, 400 / columns, 170 / rows);
  const left = 300 - (columns * size) / 2 + (labelled ? 14 : 0);
  const top = 60;
  let body = text(300, 28, options.caption);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < columns; c++) {
      const intensity = Math.abs(values[r][c]) / peak;
      const blocked = options.mask && c > r;
      body += `<rect x="${left + c * size}" y="${top + r * size}" width="${Math.max(1, size - 2)}" height="${Math.max(1, size - 2)}" class="${blocked ? "blocked" : "signal"}"${blocked ? "" : ` opacity="${(0.45 + 0.55 * intensity).toFixed(3)}"`}/>`;
    }
  const columnLabels = options.columnLabels ?? options.rowLabels ?? [];
  // A word label is wider than a cell, so long column labels become indexes and
  // the row labels carry the names.
  const numbered = columnLabels.some((label) => label.length > 2);
  if (labelled) {
    options.rowLabels.forEach((label, r) => {
      body += text(left - 18, top + r * size + size / 2 + 5, label);
    });
    columnLabels.forEach((label, c) => {
      body += text(left + c * size + size / 2, top + rows * size + 24, numbered ? String(c) : label);
    });
  }
  body += text(
    300,
    268,
    labelled
      ? `Rows: from · columns: ${numbered ? "row order, numbered" : "to"} · brighter = larger`
      : `${rows} × ${columns} values · brighter = larger`,
  );
  return frame(options.caption, body, options.description);
}

/** Two-dimensional embedding scatter with one label per point. */
export function scatterGraphic(points: number[][], labels: string[], caption: string): string {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const span = (values: number[]) => {
    const low = Math.min(...values);
    const high = Math.max(...values);
    const pad = (high - low || 1) * 0.12;
    return [low - pad, high + pad];
  };
  const [x0, x1] = span(xs);
  const [y0, y1] = span(ys);
  const px = (value: number) => 70 + ((value - x0) / (x1 - x0)) * 470;
  const py = (value: number) => 230 - ((value - y0) / (y1 - y0)) * 175;
  let body = text(300, 25, caption) + line(65, 45, 65, 235) + line(65, 235, 550, 235);
  points.forEach((point, i) => {
    body += `<circle cx="${px(point[0]).toFixed(1)}" cy="${py(point[1]).toFixed(1)}" r="7" class="block"/>`;
    body += text(px(point[0]), py(point[1]) + 5, labels[i] ?? "");
  });
  body += text(300, 266, "Dimension 1 → · dimension 2 ↑ · learned positions, not a projection");
  return frame(
    caption,
    body,
    `${points.length} learned vectors placed by their two coordinates. Labels are the characters they represent; nearby labels behave similarly in this model.`,
  );
}

/** Activation histogram with the saturated tails marked. */
export function histogramGraphic(bins: number[], caption: string, saturated: number): string {
  const threshold = SATURATION_THRESHOLD;
  const peak = Math.max(...bins, 1e-12);
  const width = 460 / bins.length;
  let body = text(300, 25, caption);
  const edge = 70 + 460 * ((threshold + 1) / 2);
  body += `<rect x="${edge}" y="60" width="${540 - edge}" height="160" class="blocked" opacity="0.85"/>`;
  body += `<rect x="70" y="60" width="${540 - edge}" height="160" class="blocked" opacity="0.85"/>`;
  bins.forEach((share, i) => {
    const height = (share / peak) * 150;
    body += `<rect x="${(70 + i * width).toFixed(1)}" y="${(220 - height).toFixed(1)}" width="${Math.max(1, width - 2).toFixed(1)}" height="${height.toFixed(1)}" class="signal"/>`;
  });
  body += line(70, 220, 540, 220) + text(75, 245, "−1") + text(305, 245, "0") + text(535, 245, "+1");
  body += text(300, 270, `Dark bands: |activation| > ${threshold} · ${(100 * saturated).toFixed(1)}% saturated`);
  return frame(
    caption,
    body,
    `Distribution of activations between −1 and +1. ${(100 * saturated).toFixed(1)} percent of units are beyond ${threshold}, in the flat tails of tanh where gradients are near zero.`,
  );
}

export interface Series {
  label: string;
  values: number[];
  comparison?: boolean;
}

/** Line plot for losses, schedules, per-layer statistics, and scaling curves. */
export function seriesGraphic(
  series: Series[],
  caption: string,
  options: { logScale?: boolean; xLabel?: string; yLabel?: string } = {},
): string {
  const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v) && (!options.logScale || v > 0));
  if (!all.length) return frame(caption, emptyPlate("No values to plot"), caption);
  const transform = (value: number) => (options.logScale ? Math.log10(Math.max(value, 1e-12)) : value);
  const low = Math.min(...all.map(transform));
  const high = Math.max(...all.map(transform));
  const range = high - low || 1;
  const longest = Math.max(...series.map((s) => s.values.length));
  const px = (index: number) => 70 + (index / Math.max(1, longest - 1)) * 460;
  const py = (value: number) => 215 - ((transform(value) - low) / range) * 160;
  let body = text(300, 25, caption) + line(65, 45, 65, 220) + line(65, 220, 545, 220);
  const legend: string[] = [];
  series.forEach((entry, i) => {
    const points = entry.values
      .filter((v) => Number.isFinite(v) && (!options.logScale || v > 0))
      .map((value, index) => `${px(index).toFixed(1)},${py(value).toFixed(1)}`)
      .join(" ");
    const dashed = i > 0 || entry.comparison;
    body += `<polyline class="${dashed ? "comparison" : "curve"}" points="${points}"/>`;
    legend.push(`${dashed ? "dashed" : "solid"}: ${entry.label}`);
  });
  // One legend line and one axis line: two rows fit under the plot, three do not.
  body += text(300, 247, legend.join(" · ")) + text(300, 272, options.xLabel ?? "");
  const first = series[0].values.at(0);
  const last = series[0].values.at(-1);
  return frame(
    caption,
    body,
    `${series.map((s) => s.label).join(" and ")} plotted against ${options.xLabel || "the step index"}${options.logScale ? " on a logarithmic vertical axis" : ""}. The first series runs from ${round(first)} to ${round(last)}.`,
  );
}

/** Hierarchical context: positions merge pairwise up to one prediction. */
export function treeGraphic(fanIn: number, depth: number): string {
  const leaves = Math.min(fanIn ** depth, 16);
  const levels = Math.min(depth, 4);
  let body = text(300, 25, `Fan-in ${fanIn} · ${fanIn ** depth} context positions`);
  const centres: number[][] = [Array.from({ length: leaves }, (_, i) => 70 + (i * 460) / Math.max(1, leaves - 1))];
  for (let level = 0; level < levels; level++) {
    const previous = centres[level];
    const groups = Math.max(1, Math.ceil(previous.length / fanIn));
    const next: number[] = [];
    for (let g = 0; g < groups; g++) {
      const members = previous.slice(g * fanIn, (g + 1) * fanIn);
      const centre = members.reduce((a, b) => a + b, 0) / members.length;
      next.push(centre);
      for (const member of members) body += line(member, 222 - level * 40, centre, 190 - level * 40);
    }
    centres.push(next);
  }
  centres.forEach((level, index) => {
    for (const x of level)
      body += `<rect x="${(x - 10).toFixed(1)}" y="${222 - index * 40 - 10}" width="20" height="20" class="signal"/>`;
  });
  body += text(300, 258, "Each level combines neighbouring groups instead of one wide layer");
  return frame(
    "Hierarchical context tree",
    body,
    `Context positions at the bottom combine ${fanIn} at a time through ${levels} levels toward a single prediction. Up to 16 positions are drawn.`,
  );
}

/** Token boundaries of a string: what the model receives after tokenisation. */
export function tokenRibbonGraphic(pieces: string[], caption: string): string {
  // Fewer plates per figure keeps each token wide enough to carry its own text.
  const visible = pieces.slice(0, 14);
  const lengths = visible.map((piece) => Math.max(1, piece.length));
  const total = lengths.reduce((a, b) => a + b, 0);
  let body = text(300, 28, caption);
  let offset = 0;
  visible.forEach((piece, i) => {
    const width = (lengths[i] / total) * 480;
    const x = 60 + (offset / total) * 480;
    body += `<rect x="${x.toFixed(1)}" y="${i % 2 ? 140 : 90}" width="${Math.max(2, width - 2).toFixed(1)}" height="46" class="${i % 2 ? "block" : "blocked"}"/>`;
    if (width > 34) body += text(x + width / 2, (i % 2 ? 140 : 90) + 28, piece.replace(/\n/g, "⏎").replace(/ /g, "␣").slice(0, 4));
    offset += lengths[i];
  });
  body += text(300, 215, `${pieces.length} tokens${pieces.length > visible.length ? ` · first ${visible.length} drawn` : ""}`);
  body += text(300, 250, "Rows alternate so neighbouring token boundaries stay visible");
  return frame(
    caption,
    body,
    `Token boundaries for the sample text: ${pieces.length} tokens, drawn with width proportional to their byte length. Spaces are shown as ␣ and newlines as ⏎.`,
  );
}
