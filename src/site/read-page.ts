import { mountHardwareProfile } from "./hardware-profile.ts";
import { markdown } from "./markdown.ts";
import { startExplorer } from "./explorer.ts";
import { element as $ } from "./dom.ts";
const path =
  new URL(location.href).searchParams.get("doc") || "docs/06-resources.md";
const safe =
  /^(?:(?:docs|modules|assessments|projects|templates|progress)\/[\w/-]+|README|START_HERE|CONTRIBUTING|LICENSE)\.md$/.test(
    path,
  ) && !path.split("/").includes("..");
startExplorer();
if (!safe) {
  $("guide-body").textContent =
    "This document path is not part of the course library.";
} else {
  const url = new URL(`../${path}`, location.href);
  url.searchParams.set("raw", "1");
  $("raw-source").href = url.href;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const source = await response.text();
    $("guide-body").innerHTML = markdown(source, url);
    if(path === "docs/09-home-lab.md") mountHardwareProfile($("guide-body"));
    document.title = `${document.querySelector("#guide-body h1")?.textContent || path} · Training Lab`;
    for (const heading of document.querySelectorAll("#guide-body h2")) {
      const a = document.createElement("a");
      a.href = `#${heading.id}`;
      a.textContent = heading.textContent;
      $("reader-toc").append(a);
    }
    const videos = [
      ...source.matchAll(
        /\[([^\]]+)\]\(https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})\)/g,
      ),
    ];
    for (const [, label, id] of videos) {
      const button = document.createElement("button");
      button.textContent = label;
      button.onclick = () => {
        $("reader-video").innerHTML =
          `<iframe title="Referenced course lecture" src="https://www.youtube-nocookie.com/embed/${id}" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      };
      $("reader-video-choices").append(button);
    }
    $("reader-media").hidden = !videos.length;
    if (location.hash)
      document
        .getElementById(decodeURIComponent(location.hash.slice(1)))
        ?.scrollIntoView();
  } catch (error) {
    $("guide-body").textContent =
      `Document could not load: ${error.message}. Return to the course and choose a listed document.`;
  }
}
