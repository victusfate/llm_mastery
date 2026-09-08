export const DAY = 86400000;
export function softmax(logits, temperature = 1) {
  if (!(temperature > 0) || !logits.length || !logits.every(Number.isFinite))
    throw new Error("Invalid softmax input");
  const scaled = logits.map((x) => x / temperature);
  const max = Math.max(...scaled);
  const exp = scaled.map((x) => Math.exp(x - max));
  const total = exp.reduce((a, b) => a + b, 0);
  return exp.map((x) => x / total);
}
export function numericCorrect(answer, expected, tolerance = 0.01) {
  if (typeof answer !== "string" || !answer.trim()) return false;
  const value = Number(answer);
  return Number.isFinite(value) && Math.abs(value - expected) <= tolerance;
}
export function scheduleReview(previous, correct, assisted, now = Date.now()) {
  const old = previous || { streak: 0, attempts: 0, correct: 0 };
  const eligible = !previous || now >= old.due;
  const streak =
    correct && !assisted ? Math.min(old.streak + Number(eligible), 4) : 0;
  const delay = streak ? [1, 3, 7, 14][streak - 1] * DAY : 10 * 60000;
  return {
    streak,
    attempts: old.attempts + 1,
    correct: old.correct + Number(correct),
    due: correct && !assisted && !eligible ? old.due : now + delay,
    last: now,
  };
}
export const freshState = () => ({
  version: 1,
  selected: 0,
  reviews: {},
  notes: {},
  history: [],
});
export function validateState(data) {
  if (
    !data ||
    data.version !== 1 ||
    !Number.isInteger(data.selected) ||
    data.selected < 0 ||
    data.selected > 9
  )
    throw new Error("Unsupported progress file");
  const state = freshState();
  state.selected = data.selected;
  for (const [key, item] of Object.entries(data.reviews || {})) {
    if (
      !/^\d-[01]$/.test(key) ||
      !item ||
      !["streak", "attempts", "correct", "due", "last"].every(
        (k) => Number.isFinite(item[k]) && item[k] >= 0,
      ) ||
      item.streak > 4 ||
      !Number.isInteger(item.streak) ||
      item.correct > item.attempts
    )
      throw new Error("Invalid review record");
    state.reviews[key] = Object.fromEntries(
      ["streak", "attempts", "correct", "due", "last"].map((k) => [k, item[k]]),
    );
  }
  for (const [key, note] of Object.entries(data.notes || {})) {
    if (!/^[0-9]$/.test(key) || typeof note !== "string" || note.length > 30000)
      throw new Error("Invalid learning note");
    state.notes[key] = note;
  }
  if (!Array.isArray(data.history) || data.history.length > 20000)
    throw new Error("Invalid history");
  for (const row of data.history) {
    if (
      !row ||
      typeof row.question !== "string" ||
      row.question.length > 2000 ||
      typeof row.answer !== "string" ||
      row.answer.length > 1000 ||
      typeof row.correct !== "boolean" ||
      typeof row.assisted !== "boolean" ||
      !Number.isFinite(row.time) ||
      !Number.isInteger(row.module) ||
      row.module < 0 ||
      row.module > 9
    )
      throw new Error("Invalid attempt");
    state.history.push({
      question: row.question,
      answer: row.answer,
      correct: row.correct,
      assisted: row.assisted,
      time: row.time,
      module: row.module,
    });
  }
  return state;
}
export function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
// Small, escaped Markdown subset: no raw HTML or executable URLs.
export function markdown(text, baseURL) {
  const inline = (value) =>
    escapeHTML(value)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, target) => {
        try {
          const url = new URL(target, baseURL);
          return /^https?:$/.test(url.protocol)
            ? `<a href="${escapeHTML(url.href)}" target="_blank" rel="noopener">${label}</a>`
            : label;
        } catch {
          return label;
        }
      })
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const lines = text.split("\n");
  let result = "",
    code = false,
    table = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      if (table) {
        result += "</tbody></table></div>";
        table = false;
      }
      code = !code;
      result += code ? "<pre><code>" : "</code></pre>";
      continue;
    }
    if (code) {
      result += escapeHTML(line) + "\n";
      continue;
    }
    if (line.startsWith("|")) {
      if (/^\|[\s:|\-]+$/.test(line)) continue;
      if (!table) {
        result += '<div class="table-scroll"><table><tbody>';
        table = true;
      }
      result +=
        "<tr>" +
        line
          .split("|")
          .slice(1, -1)
          .map((cell) => `<td>${inline(cell.trim())}</td>`)
          .join("") +
        "</tr>";
      continue;
    }
    if (table) {
      result += "</tbody></table></div>";
      table = false;
    }
    const heading = line.match(/^(#{1,6}) (.*)/);
    if (heading)
      result += `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
    else if (line.trim()) result += `<p>${inline(line)}</p>`;
  }
  if (code) result += "</code></pre>";
  if (table) result += "</tbody></table></div>";
  return result;
}
export function makeQuestion(module, variant = 0, rng = Math.random) {
  const pick = (values) => values[Math.floor(rng() * values.length)];
  const n = pick([2, 4, 8]);
  const q = (prompt, expected, explanation) => ({
    key: `${module}-${variant}`,
    prompt,
    expected,
    explanation,
    tolerance: 0.01,
  });
  switch (module) {
    case 0:
      return variant === 0
        ? q(
            `For ${n} equally likely classes, what is cross-entropy in natural-log units for one correct label?`,
            Math.log(n),
            "Cross-entropy is −ln(p_correct), so uniform predictions give ln(number of classes).",
          )
        : q(
            `A mean loss over ${n} examples has p_correct=0.25 for one example. What is the gradient with respect to its correct-class logit?`,
            -0.75 / n,
            "The gradient is (p − y)/batch_size. Here y=1.",
          );
    case 1:
      return variant === 0
        ? q(
            `A causal sequence has ${n} tokens. Including each token attending to itself, how many query–key pairs are allowed?`,
            (n * (n + 1)) / 2,
            "The rows allow 1, 2, …, T positions, giving T(T+1)/2.",
          )
        : q(
            `Batch=2, heads=4, sequence length=${n}. How many scalar entries are in the full attention score tensor?`,
            8 * n * n,
            "Scores have shape B × H × T × T.",
          );
    case 2: {
      const total = pick([1000, 2000, 4000]);
      return variant === 0
        ? q(
            `${total} input documents: 10% rejected, then 20% of the remainder removed as duplicates. How many remain?`,
            total * 0.9 * 0.8,
            "Apply the second fraction to the remaining documents, not the original count.",
          )
        : q(
            `Corpus A has ${total} tokens and corpus B has ${total * 3}. You sample sources equally, then sample a token uniformly within the selected source. How many times more likely is an individual A token than a B token?`,
            3,
            "Source-level and token-level mixture weights differ. Each A token gets three times the probability.",
          );
    }
    case 3:
      return variant === 0
        ? q(
            `Two DDP workers each use microbatch ${n} sequences with 4 accumulation steps. What is the global batch size in sequences?`,
            8 * n,
            "Global batch = workers × microbatch × accumulation, assuming equal contributions.",
          )
        : q(
            `A dense model has ${n * 10} million parameters and uses 16 bytes of parameter/gradient/optimizer state per parameter. How many decimal GB is that, before activations?`,
            n * 0.16,
            "Multiply parameter count by bytes, then divide by 1e9. This excludes activations and other buffers.",
          );
    case 4:
      return variant === 0
        ? q(
            `Using the rough formula 6ND, N=${n * 10} million and D=100 million. How many petaFLOPs (1e15 operations) are estimated?`,
            n * 6,
            "Use counts, not values in millions: 6 × N × D / 1e15.",
          )
        : q(
            `For ${n * 100} evaluated examples, ${n * 60} are correct, ${n * 30} wrong, and ${n * 10} invalid. Treating invalid responses as failures, what is accuracy as a fraction?`,
            0.6,
            "Keep invalid samples in the declared denominator: correct / all examples.",
          );
    case 5:
      return variant === 0
        ? q(
            `An example has ${n * 10} prompt tokens, ${n} response tokens and 3 padding tokens. Assistant-only SFT supervises the response including EOS already counted there. How many labels are active?`,
            n,
            "Prompt and padding labels are masked; only the specified response positions count.",
          )
        : q(
            `A 100×${n * 10} weight matrix uses a rank-2 LoRA update A(100×2)B(2×${n * 10}). How many adapter parameters are trained (no biases)?`,
            200 + 20 * n,
            "Low-rank parameter count is rank × (input_width + output_width).",
          );
    case 6: {
      const p = pick([0.2, 0.4, 0.7]);
      return variant === 0
        ? q(
            `A bandit chooses A with probability ${p}. Rewards are A=3 and B=1. What is expected reward?`,
            1 + 2 * p,
            "Expected reward = p×3 + (1−p)×1.",
          )
        : q(
            `For a Bernoulli logit z with p(A)=${p} and rewards A=3, B=1, what is d expected_reward / dz?`,
            2 * p * (1 - p),
            "dp/dz=p(1−p); multiply by reward difference 2.",
          );
    }
    case 7:
      return variant === 0
        ? q(
            "In DPO, current and reference policies are identical. What is the per-pair loss −ln(sigmoid(beta×delta))?",
            Math.log(2),
            "Both log-ratios vanish: delta=0, sigmoid(0)=0.5.",
          )
        : q(
            `A PPO action had rollout-policy probability 0.2 and current-policy probability ${n * 0.05}. What is the importance ratio?`,
            n * 0.25,
            "Ratio = current probability / old rollout probability, not reference probability.",
          );
    case 8:
      return variant === 0
        ? q(
            `A group of ${n} responses has reward 1 for every response. With mean-centered advantages divided by std+epsilon, what is each advantage?`,
            0,
            "The numerator is zero for every response. This prompt supplies no relative reward signal.",
          )
        : q(
            `Out of ${n * 10} held-out prompts, ${n * 6} have a correct first sampled response. What is pass@1 as a fraction?`,
            0.6,
            "Count one first sample per prompt. Best-of-k success answers a different question.",
          );
    case 9:
      return variant === 0
        ? q(
            `Paired seed results: baseline [0.40,0.50,0.60], intervention [0.42,0.51,0.58]. What is the mean improvement in percentage points?`,
            1 / 3,
            "Differences are +2,+1,−2 percentage points; the mean is 1/3. A small mean alone does not establish a robust effect.",
          )
        : q(
            `An experiment uses ${n} GPUs for 3 wall hours. How many GPU-hours does it consume?`,
            n * 3,
            "GPU-hours sum across devices. They differ from elapsed wall hours.",
          );
    default:
      throw new Error("Unknown module");
  }
}
