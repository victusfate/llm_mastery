import { markdown } from "./engine.ts";
import { element as $ } from "./dom.ts";
const titles = [
  "From familiar models to neural training",
  "Track the shapes",
  "From logits to loss",
  "Understand the gradient",
  "Run the worked example",
  "Connect to a training loop",
  "Use controls to understand the result",
  "Build and demonstrate understanding",
];
export function setupLecture() {
  const audio = $("lecture-audio");
  let selected = 0,
    chapter = 0,
    transcript = [],
    moduleInfo = null;
  const scriptURL = new URL("../docs/13-foundations-lecture.md", location.href);
  const ready = fetch(scriptURL)
    .then((r) => {
      if (!r.ok) throw new Error("Transcript unavailable");
      return r.text();
    })
    .then((text) => {
      transcript = text.split(/^## /m).slice(1);
      if (selected === 0) showTranscript();
    })
    .catch(() => {
      $("transcript-body").textContent =
        "The transcript could not be loaded; the full module text is still available below.";
    });
  function showTranscript() {
    if (selected === 0 && transcript[chapter])
      $("transcript-body").innerHTML = markdown(
        "## " + transcript[chapter],
        scriptURL,
      );
  }
  function loadChapter(number) {
    chapter = number;
    audio.src = `audio/foundations-${String(number + 1).padStart(2, "0")}.mp3`;
    audio.load();
    $("lecture-status").textContent =
      `Chapter ${number + 1} of 8 · ${titles[number]} · Mitchell, English (New Zealand)`;
    for (const [i, b] of [...$("lecture-chapters").children].entries())
      b.setAttribute("aria-current", i === number ? "step" : "false");
    showTranscript();
  }
  async function play() {
    $("lecture-player").open = true;
    try {
      await audio.play();
    } catch {
      $("lecture-status").textContent =
        "Audio could not play. Try the player controls or read the transcript; check that the narration file loaded.";
    }
  }
  audio.addEventListener("error", () => {
    $("lecture-status").textContent =
      "Narration could not load. Read the complete text below and retry after refreshing.";
  });
  audio.addEventListener("ended", () => {
    $("lecture-status").textContent =
      selected === 0
        ? `Chapter ${chapter + 1} complete. Pause to explore the example, then choose the next chapter.`
        : "Lecture complete. Continue to the dedicated labs.";
  });
  return {
    select(index, info) {
      audio.pause();
      selected = index;
      moduleInfo = info;
      chapter = 0;
      $("lecture-chapters").replaceChildren();
      if (index === 0) {
        for (const [i, title] of titles.entries()) {
          const button = document.createElement("button");
          button.textContent = `${i + 1}. ${title}`;
          button.onclick = () => {
            loadChapter(i);
            play();
          };
          $("lecture-chapters").append(button);
        }
        loadChapter(0);
        $("lecture-transcript").hidden = false;
      } else {
        audio.src = `audio/${info.file}.mp3`;
        audio.load();
        $("lecture-status").textContent =
          "Full module prose · Mitchell, English (New Zealand). Equations and code are best read in the text below.";
        $("lecture-transcript").hidden = true;
      }
    },
    play,
    stop() {
      audio.pause();
      audio.currentTime = 0;
    },
    ready,
  };
}
