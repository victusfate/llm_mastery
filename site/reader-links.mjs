// Use the same reader under localhost, a GitHub Pages project prefix, or a custom domain.
export function readingURL(target, baseURL) {
  const url = new URL(target, baseURL),
    base = new URL(baseURL);
  if (
    url.origin !== base.origin ||
    !url.pathname.endsWith(".md") ||
    url.searchParams.has("raw")
  )
    return url.href;
  const match = url.pathname.match(
    /^(.*\/)((?:docs|modules|assessments|projects|templates|progress)\/.*\.md)$/,
  );
  const root = url.pathname.match(
    /^(.*\/)(README|START_HERE|CONTRIBUTING|LICENSE)\.md$/,
  );
  if (!match && !root) return url.href;
  const prefix = match ? match[1] : root[1];
  const doc = match ? match[2] : `${root[2]}.md`;
  const reader = new URL(`${prefix}site/read.html`, url.origin);
  reader.searchParams.set("doc", doc);
  reader.hash = url.hash;
  return reader.href;
}
export function enhanceReadingLinks(root = document) {
  for (const link of root.querySelectorAll("a[href]")) {
    const before = link.getAttribute("href");
    if (!before || before.startsWith("#")) continue;
    const after = readingURL(before, location.href);
    if (
      new URL(after).origin === location.origin &&
      new URL(after).pathname.endsWith("/site/read.html")
    ) {
      link.href = after;
      link.removeAttribute("target");
    }
  }
}
