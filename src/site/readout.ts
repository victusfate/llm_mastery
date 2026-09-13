// Readout helpers shared across the site.
//
// The metric tile and the scrollable table are the two shapes a panel uses to
// put exact numbers beside a figure. They live here so the Zero to Hero panels,
// the module sandbox, and the module page all render them identically.

import { escapeHTML as esc } from "./engine.ts";

export const metric = (value: string | number, label: string) =>
  `<div class="metric"><strong>${esc(String(value))}</strong><span>${esc(label)}</span></div>`;

export const metrics = (entries: [string | number, string][]) =>
  '<div class="metrics">' + entries.map(([value, label]) => metric(value, label)).join("") + "</div>";

export const table = (headers: string[], rows: string[][]) =>
  '<div class="table-scroll"><table><thead><tr>' +
  headers.map((heading) => `<th scope="col">${esc(heading)}</th>`).join("") +
  "</tr></thead><tbody>" +
  rows.map((row) => "<tr>" + row.map((cell) => `<td>${esc(cell)}</td>`).join("") + "</tr>").join("") +
  "</tbody></table></div>";

/** Fixed decimals, with a dash where a value is not finite. */
export const fixed = (value: number, digits = 3) => (Number.isFinite(value) ? value.toFixed(digits) : "—");

const SCALES: [number, string][] = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];

/** Large counts at a glance: 1.24M rather than 1240000. */
export function compact(value: number): string {
  for (const [size, suffix] of SCALES)
    if (Math.abs(value) >= size) return `${(value / size).toFixed(size === 1e3 ? 1 : 2)}${suffix}`;
  return value.toFixed(0);
}

/** A number for a diagram label: exponential at the extremes, else `digits` decimals. */
export function labelNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "∞";
  if (Math.abs(value) >= 1000 || (Math.abs(value) < 0.001 && value !== 0)) return value.toExponential(1);
  return Number(value.toFixed(digits)).toString();
}
