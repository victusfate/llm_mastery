export interface Concept { title:string; aliases:string[]; related:string[]; module:string; video:string; body:string }
export function normalizeTerm(text) {
  return text
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/[^\p{L}\p{N}@+.-]+/gu, " ")
    .trim();
}
export function parseConcepts(source) {
  return source
    .split(/^## /m)
    .slice(1)
    .map((section) => {
      const [title, ...rest] = section.split("\n");
      const metadata:Record<string,string> = {};
      const body = rest
        .filter((line) => {
          const match = line.match(/^(Aliases|Related|Module|Video): (.*)$/);
          if (!match) return true;
          metadata[match[1].toLowerCase()] = match[2];
          return false;
        })
        .join("\n")
        .trim();
      return {
        title: title.trim(),
        aliases: (metadata.aliases || "")
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean),
        related: (metadata.related || "")
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean),
        module: metadata.module || "",
        video: metadata.video || "",
        body,
      };
    });
}
export function findConcept(concepts, query) {
  const normalized = normalizeTerm(query);
  return concepts.find((c) =>
    [c.title, ...c.aliases].some(
      (alias) => normalizeTerm(alias) === normalized,
    ),
  );
}
export function searchConcepts(concepts, query) {
  const q = normalizeTerm(query),
    words = q.split(" ").filter(Boolean);
  if (!q) return concepts.slice(0, 12);
  return concepts
    .map((concept) => {
      const names = [concept.title, ...concept.aliases].map(normalizeTerm);
      const body = normalizeTerm(concept.body);
      const score = names.includes(q)
        ? 100
        : names.some((n) => n.includes(q))
          ? 50
          : words.reduce(
              (s, w) =>
                s +
                (names.some((n) => n.includes(w))
                  ? 8
                  : body.includes(w)
                    ? 1
                    : 0),
              0,
            );
      return { concept, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.concept);
}
export function conceptMatcher(concepts:Concept[]) {
  const names = [
    ...new Set(
      concepts
        .flatMap((c) => [c.title, ...c.aliases])
        .filter((s) => s.length > 1),
    ),
  ].sort((a, b) => b.length - a.length);
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?<![\\p{L}\\p{N}_])(${names.map(escape).join("|")})(?![\\p{L}\\p{N}_])`,
    "giu",
  );
}
export function annotateConcepts(root, concepts) {
  if (!root || !concepts.length) return;
  const matcher = conceptMatcher(concepts);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return !node.parentElement?.closest(
        "button,a,code,pre,input,textarea,select,script,style,svg,h1,h2,[data-no-concepts]",
      ) && node.textContent.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    matcher.lastIndex = 0;
    const matches = [...node.textContent.matchAll(matcher)];
    if (!matches.length) continue;
    const fragment = document.createDocumentFragment();
    let position = 0;
    for (const match of matches) {
      fragment.append(
        document.createTextNode(node.textContent.slice(position, match.index)),
      );
      const button = document.createElement("button");
      button.type = "button";
      button.className = "concept-term";
      button.dataset.term = findConcept(concepts, match[0]).title;
      button.textContent = match[0];
      button.setAttribute("aria-label", `Explain ${match[0]}`);
      button.setAttribute("aria-haspopup", "dialog");
      fragment.append(button);
      position = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(node.textContent.slice(position)));
    node.replaceWith(fragment);
  }
}
