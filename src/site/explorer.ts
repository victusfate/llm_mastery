import { mountTutor } from "./tutor.ts";
import { conceptVisual } from "./concept-visuals.ts";
import { resourcesHTML } from "./concept-primer.ts";
import { enhanceReadingLinks } from "./reader-links.ts";
import {
  parseConcepts,
  findConcept,
  searchConcepts,
  annotateConcepts,
} from "./concepts.ts";
import { markdown, escapeHTML as esc } from "./engine.ts";
import { element as $ } from "./dom.ts";
export function startExplorer() {
  const dialog = $("concept-dialog"),
    history = [];
  let concepts = [],
    selected = null,
    context = "",
    ticket = 0;
  mountTutor(dialog.querySelector('#concept-scroll'), () => ({title:selected?.title || 'this concept',text:selected?.body || context}));
  if(document.querySelector('main'))mountTutor(document.querySelector('main'),()=>({title:document.title,text:document.querySelector('#guide-body')?.textContent || ''}));
  const source = new URL("../docs/12-concepts.md", location.href);
  const ready = fetch(source)
    .then((r) => {
      if (!r.ok) throw new Error("Concept guide could not be loaded");
      return r.text();
    })
    .then((text) => {
      concepts = parseConcepts(text);
      decorate();
      return concepts;
    });
  ready.catch(() => {
    $("concept-status").textContent =
      "Concept guide unavailable. Reload or check the local server.";
  });
  const regions = [
    "summary",
    "prediction",
    "lab",
    "defense",
    "question",
    "feedback",
    "visual-explanation",
    "guide-body",
    "walkthrough-body",
    "transcript-body",
  ];
  const observer = new MutationObserver(() => decorate());
  function decorate() {
    observer.disconnect();
    enhanceReadingLinks();
    for (const id of regions) annotateConcepts($(id), concepts);
    for (const id of regions)
      if ($(id))
        observer.observe($(id), {
          childList: true,
          subtree: true,
          characterData: true,
        });
  }
  decorate();
  function showDialog() {
    if (!dialog.open) dialog.showModal();
    $("selection-explain").hidden = true;
  }
  function renderRelated(results) {
    $("concept-related").replaceChildren();
    for (const entry of results) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = entry.title;
      b.onclick = () => open(entry.title, context);
      $("concept-related").append(b);
    }
  }
  async function open(query = "", surrounding = "", back = false) {
    const current = ++ticket;
    showDialog();
    context = surrounding.slice(0, 800);
    $("concept-search").value = query.slice(0, 120);
    $("concept-context").textContent = context
      ? `From your lesson: “${context}”`
      : "";
    $("concept-status").textContent = "";
    $("concept-video").replaceChildren();
    $("concept-media").replaceChildren();
    try {
      await ready;
    } catch {
      $("concept-title").textContent = "Concept guide unavailable";
      $("concept-body").textContent =
        "Reload to try again. Your lesson remains available.";
      return;
    }
    if (current !== ticket) return;
    if (!back) history.push({ query, context });
    $("concept-back").disabled = history.length < 2;
    selected = findConcept(concepts, query);
    if (query)
      document.dispatchEvent(
        new CustomEvent("conceptlookup", { detail: { query } }),
      );
    if (selected) {
      $("concept-title").textContent = selected.title;
      $("concept-body").innerHTML = markdown(selected.body, source);
      $("concept-body").querySelector("p")?.insertAdjacentHTML("afterend", conceptVisual(selected.title));
      $("concept-body").insertAdjacentHTML("beforeend", resourcesHTML(selected.module));
      annotateConcepts($("concept-body"), concepts);
      renderRelated(
        selected.related.map((t) => findConcept(concepts, t)).filter(Boolean),
      );
      if (selected.video) {
        const url = new URL(selected.video);
        const video = url.searchParams.get("v");
        if (
          url.hostname === "www.youtube.com" &&
          /^[\w-]{11}$/.test(video || "")
        ) {
          const button = document.createElement("button");
          button.textContent = "Watch related lecture";
          button.onclick = () => {
            $("concept-video").innerHTML =
              `<iframe title="Related lecture: ${esc(selected.title)}" src="https://www.youtube-nocookie.com/embed/${video}" allow="fullscreen; picture-in-picture" allowfullscreen></iframe><p class="small">Complete lecture; <a href="${esc(selected.video)}" target="_blank" rel="noopener">open on YouTube</a> if embedding is unavailable.</p>`;
          };
          $("concept-media").append(button);
        }
      }
    } else {
      $("concept-title").textContent = query
        ? `Explore “${query}”`
        : "Explore a concept";
      const results = searchConcepts(concepts, query);
      $("concept-body").innerHTML = query
        ? "<p>No exact field-guide entry for this phrase yet. These related concepts may explain the passage; use the contextual tutor prompt for a deeper answer.</p>"
        : "<p>Search a term, click a highlighted concept, or select a phrase anywhere in a lesson. Each explanation includes an example, a common mistake, and a retrieval question.</p>";
      renderRelated(results);
      if (query && !results.length)
        $("concept-body").innerHTML +=
          "<p>Try a shorter phrase or copy the tutor prompt with the selected passage.</p>";
    }
    $("concept-scroll").scrollTop = 0;
  }
  $("concept-open").onclick = () => {
    open();
    $("concept-search").focus();
  };
  $("concept-search-form").onsubmit = (e) => {
    e.preventDefault();
    open($("concept-search").value, context);
  };
  $("concept-back").onclick = () => {
    history.pop();
    const previous = history.at(-1);
    if (previous) open(previous.query, previous.context, true);
  };
  $("concept-close").onclick = () => dialog.close();
  dialog.addEventListener("close", () => {
    $("concept-video").replaceChildren();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  document.addEventListener("click", (e) => {
    const term = (e.target as Element).closest<HTMLElement>("[data-term]");
    if (term) {
      open(term.dataset.term, term.closest("p,li,td")?.textContent || "");
    }
  });
  let selection = { text: "", context: "" };
  function capture() {
    const s = window.getSelection();
    const text = s?.toString().trim();
    const node = s?.anchorNode?.parentElement;
    if (
      !text ||
      text.length > 120 ||
      !node?.closest("#main,#concept-body") ||
      node.closest("textarea,input")
    ) {
      $("selection-explain").hidden = true;
      selection = {text: "", context: ""};
      return;
    }
    selection = {
      text,
      context: (node.closest("p,li,td,pre") || node).textContent.slice(0, 800),
    };
    const r = s.getRangeAt(0).getBoundingClientRect(),
      b = $("selection-explain");
    // A native dialog makes the rest of the document inert; put the selection action inside it when needed.
    (dialog.open ? dialog : document.body).append(b);
    b.hidden = false;
    b.style.left = `${Math.max(8, Math.min(window.innerWidth - 180, r.left))}px`;
    b.style.top = `${Math.max(8, Math.min(window.innerHeight - 55, r.bottom + 8))}px`;
  }
  document.addEventListener("pointerup", (e) => {
    if (!(e.target as Element).closest?.("#selection-explain")) setTimeout(capture, 0);
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift") capture();
  });
  document.addEventListener("dblclick", (e) => {
    if (
      (e.target as Element).closest?.("#main,#concept-body") &&
      !(e.target as Element).closest("button,a,input,textarea,select")
    ) {
      capture();
      if (selection.text) open(selection.text, selection.context);
    }
  });
  $("selection-explain").onpointerdown = (e) => e.preventDefault();
  $("selection-explain").onclick = () =>
    open(selection.text, selection.context);
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "d") {
      e.preventDefault();
      capture();
      open(selection.text, selection.context);
      $("concept-search").focus();
    }
  });
  $("concept-copy").onclick = async () => {
    const query =
      $("concept-search").value || selected?.title || "this concept";
    const text = `Teach me "${query}" in the context of LLM Training Mastery.\nSelected passage: ${context || "(none)"}\nGive a detailed explanation, a worked numerical or code example, one misconception, relevant primary reading/video, and a fresh transfer question. Wait for my answer before grading.\n${selected ? `Field guide: docs/12-concepts.md, ${selected.title}.` : ""}`;
    try {
      await navigator.clipboard.writeText(text);
      $("concept-status").textContent = "Contextual tutor prompt copied.";
    } catch {
      $("concept-status").textContent =
        "Clipboard unavailable. Copy the prompt below.";
      const pre = document.createElement("pre");
      pre.textContent = text;
      $("concept-body").append(pre);
    }
  };
  return { open, ready };
}
