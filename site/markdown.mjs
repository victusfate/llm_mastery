import { readingURL } from "./reader-links.mjs";
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const headingID = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
export function markdown(source, baseURL) {
  function inline(text) {
    const saved = [];
    const protect = (html) => {
      saved.push(html);
      return `\u0000${saved.length - 1}\u0000`;
    };
    let value = text.replace(/`([^`]+)`/g, (_, code) =>
      protect(`<code>${escape(code)}</code>`),
    );
    value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, target) => {
      try {
        const url = new URL(target, baseURL);
        if (!/^https?:$/.test(url.protocol)) return label;
        const href = readingURL(target, baseURL);
        const external = url.origin !== new URL(baseURL).origin;
        return protect(
          `<a href="${escape(href)}"${external ? ' target="_blank" rel="noopener"' : ""}>${escape(label)}</a>`,
        );
      } catch {
        return label;
      }
    });
    value = escape(value)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
    return value.replace(
      /\u0000(\d+)\u0000/g,
      (_, index) => saved[Number(index)],
    );
  }
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let out = "",
    paragraph = [],
    list = null;
  function flush() {
    if (paragraph.length) {
      out += `<p>${inline(paragraph.join(" "))}</p>`;
      paragraph = [];
    }
  }
  function closeList() {
    if (list) {
      out += `</${list}>`;
      list = null;
    }
  }
  function cells(line) {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      flush();
      closeList();
      const language = line.slice(3).trim();
      const code = [];
      while (++i < lines.length && !lines[i].startsWith("```"))
        code.push(lines[i]);
      out += `<pre><code${language ? ` class="language-${escape(language)}"` : ""}>${escape(code.join("\n"))}</code></pre>`;
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flush();
      closeList();
      const level = heading[1].length;
      out += `<h${level} id="${escape(headingID(heading[2]))}">${inline(heading[2])}</h${level}>`;
      continue;
    }
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-+:?\s*\|[\s|:\-]*$/.test(lines[i + 1])
    ) {
      flush();
      closeList();
      out +=
        '<div class="table-scroll"><table><thead><tr>' +
        cells(line)
          .map((c) => `<th scope="col">${inline(c)}</th>`)
          .join("") +
        "</tr></thead><tbody>";
      i++;
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
        i++;
        out +=
          "<tr>" +
          cells(lines[i])
            .map((c) => `<td>${inline(c)}</td>`)
            .join("") +
          "</tr>";
      }
      out += "</tbody></table></div>";
      continue;
    }
    const item = line.match(/^\s*(?:([-*])|(\d+)\.)\s+(.*)$/);
    if (item) {
      flush();
      const type = item[1] ? "ul" : "ol";
      if (list !== type) {
        closeList();
        list = type;
        out += `<${type}${type === "ol" && item[2] !== "1" ? ` start="${item[2]}"` : ""}>`;
      }
      const task = item[3].match(/^\[([ xX])\]\s+(.*)/);
      out += `<li>${task ? `<input type="checkbox" disabled ${task[1].trim() ? "checked" : ""}> ${inline(task[2])}` : inline(item[3])}</li>`;
      continue;
    }
    if (line.startsWith(">")) {
      flush();
      closeList();
      out += `<blockquote>${inline(line.replace(/^>\s?/, ""))}</blockquote>`;
      continue;
    }
    if (/^\s*---+\s*$/.test(line)) {
      flush();
      closeList();
      out += "<hr>";
      continue;
    }
    if (!line.trim()) {
      flush();
      closeList();
      continue;
    }
    closeList();
    paragraph.push(line.trim());
  }
  flush();
  closeList();
  return out;
}
