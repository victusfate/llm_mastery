// quality-ok: file-length — one cohesive catalogue of 20 parallel episode records; splitting scatters the content
// Bite-sized arcade episodes. One idea each: play with a live control first,
// then read a two-sentence explanation, then answer two quick checks.
//
// Keep copy short. tests/episodes.test.ts enforces length limits so the
// arcade never turns back into a wall of terms.

export type Tone = "on" | "off" | "hi" | "warn";
export type Values = Record<string, number>;

export interface Control {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  toggle?: boolean;
  unit?: string;
  digits?: number;
}

export interface Bar { label: string; value: number; max: number; tone?: Tone; text?: string }
export interface Scene { bars?: Bar[]; tokens?: Tone[]; columns?: number; readouts: [string, string][] }

export interface Episode {
  id: string;
  module: number;
  /** Which randomized engine question family (makeQuestion variant) this episode checks. */
  variant: 0 | 1;
  title: string;
  hook: string;
  goal: string;
  controls: Control[];
  /** Control the "Watch it move" button sweeps from min to max. */
  sweep: string;
  scene: (v: Values) => Scene;
  solved: (v: Values) => boolean;
  win: string;
  idea: string;
  choice: { prompt: string; options: string[]; answer: number; why: string };
  takeaway: string;
  /** Submodule id for going deeper, e.g. "01-02". */
  deeper: string;
  source?: { label: string; href: string };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const range = (n: number, f: (i: number) => Tone) => Array.from({ length: n }, (_, i) => f(i));

// Formulas shared by an episode's picture and its goal, so the two cannot drift apart.
const pRight = (z: number) => Math.exp(z) / (Math.exp(z) + 2);
const flops = (n: number, d: number) => 6 * n * 1e6 * d * 1e9;
const COMPUTE_BUDGET = 1.2e19;
const dpoLoss = (beta: number, delta: number) => -Math.log(sigmoid(beta * delta));
function groupAdvantages(v: Values) {
  const rs = [v.r1, v.r2, v.r3, v.r4], mean = rs.reduce((a, b) => a + b) / rs.length;
  const sd = Math.sqrt(rs.reduce((a, r) => a + (r - mean) ** 2, 0) / rs.length);
  return { mean, sd, adv: rs.map((r) => (r - mean) / (sd + 1e-4)) };
}

export const episodes: Episode[] = [
  {
    id: "e01", module: 0, variant: 0,
    title: "Surprise, measured",
    hook: "How should we score a guess?",
    goal: "Push the loss under 0.20.",
    controls: [{ id: "p", label: "Probability on the right answer", min: 0.01, max: 0.99, step: 0.01, value: 0.2, digits: 2 }],
    sweep: "p",
    scene: ({ p }) => ({
      bars: [
        { label: "right answer", value: p, max: 1, tone: "on", text: pct(p) },
        { label: "loss −ln p", value: -Math.log(p), max: 4.7, tone: "warn", text: (-Math.log(p)).toFixed(3) },
      ],
      readouts: [[(-Math.log(p)).toFixed(3), "cross-entropy (nats)"]],
    }),
    solved: ({ p }) => -Math.log(p) < 0.2,
    win: "Confident and right costs almost nothing.",
    idea: "Cross-entropy is −ln of the probability the model gave the right answer. Right and sure → near 0. Sure and wrong → huge.",
    choice: { prompt: "The model gives the right token p = 0.01. The loss is about…", options: ["0.01", "4.6", "100"], answer: 1, why: "−ln(0.01) ≈ 4.6. Loss grows fast as p shrinks, but stays finite." },
    takeaway: "Loss = surprise at the truth.",
    deeper: "01-03",
    source: { label: "Goodfellow et al., Deep Learning, ch. 6", href: "https://www.deeplearningbook.org/contents/mlp.html" },
  },
  {
    id: "e02", module: 0, variant: 1,
    title: "Which way is downhill?",
    hook: "How hard does training push a logit?",
    goal: "Shrink the push on the right logit below 0.05.",
    controls: [{ id: "z", label: "Logit of the right answer (2 rivals at 0)", min: -3, max: 6, step: 0.1, value: 0, digits: 1 }],
    sweep: "z",
    scene: ({ z }) => {
      const p = pRight(z);
      return {
        bars: [
          { label: "p(right)", value: p, max: 1, tone: "on", text: pct(p) },
          { label: "|gradient| = 1 − p", value: 1 - p, max: 1, tone: "warn", text: (p - 1).toFixed(3) },
        ],
        readouts: [[(p - 1).toFixed(3), "gradient on that logit (p − y)"]],
      };
    },
    solved: ({ z }) => 1 - pRight(z) < 0.05,
    win: "Right and sure → the push fades away.",
    idea: "The gradient on each logit is p − y: what the model predicted minus the target. A wrong, confident model gets the biggest push.",
    choice: { prompt: "The right class has p = 0.25. Its gradient is −0.75. Gradient descent will…", options: ["Raise that logit", "Lower that logit", "Leave it"], answer: 0, why: "Descent steps against the gradient, so a negative gradient raises the logit." },
    takeaway: "Gradient = prediction − target.",
    deeper: "01-04",
  },
  {
    id: "e03", module: 1, variant: 0,
    title: "No peeking",
    hook: "Can a token read the future?",
    goal: "With the mask on, pick a token that can see exactly 5 tokens.",
    controls: [
      { id: "q", label: "Query position", min: 0, max: 7, step: 1, value: 1 },
      { id: "mask", label: "Causal mask", min: 0, max: 1, step: 1, value: 1, toggle: true },
    ],
    sweep: "q",
    scene: ({ q, mask }) => ({
      tokens: range(64, (i) => {
        const r = Math.floor(i / 8), c = i % 8, allowed = !mask || c <= r;
        return r === q ? (allowed ? "hi" : "off") : allowed ? "on" : "off";
      }),
      columns: 8,
      readouts: [[String(mask ? q + 1 : 8), "tokens this query may read"], ["rows = queries", "columns = keys"]],
    }),
    solved: ({ q, mask }) => mask === 1 && q === 4,
    win: "Position 4 sees positions 0–4: itself and its past.",
    idea: "A causal mask lets token t look only at tokens 0…t. Without it, next-token training can copy the answer from the future.",
    choice: { prompt: "You train with the mask switched off. Training loss…", options: ["Looks great, but the model cheated", "Gets worse", "Is unchanged"], answer: 0, why: "Each position can read the token it should predict, so loss drops without real learning." },
    takeaway: "The mask defines what the model may know.",
    deeper: "02-01",
    source: { label: "Vaswani et al., 2017", href: "https://arxiv.org/abs/1706.03762" },
  },
  {
    id: "e04", module: 1, variant: 1,
    title: "Count the scores",
    hook: "Why is long context expensive?",
    goal: "Build an attention score tensor with exactly 512 entries.",
    controls: [
      { id: "b", label: "Batch", min: 1, max: 4, step: 1, value: 1 },
      { id: "h", label: "Heads", min: 1, max: 8, step: 1, value: 1 },
      { id: "t", label: "Sequence length", min: 2, max: 16, step: 1, value: 4 },
    ],
    sweep: "t",
    scene: ({ b, h, t }) => ({
      tokens: range(t * t, (i) => (i % t <= Math.floor(i / t) ? "on" : "off")),
      columns: t,
      readouts: [[String(b * h * t * t), "scores = B × H × T × T"], [`${t}×${t}`, "one head (shown)"]],
    }),
    solved: ({ b, h, t }) => b * h * t * t === 512,
    win: "512 scores. Now double T and watch it quadruple.",
    idea: "Each head scores every query against every key: a T × T grid. Doubling the sequence length makes four times as many scores.",
    choice: { prompt: "Sequence length doubles. Score memory grows…", options: ["×2", "×4", "×8"], answer: 1, why: "T × T: doubling both sides gives four times the entries." },
    takeaway: "Attention cost grows with T².",
    deeper: "02-01",
  },
  {
    id: "e05", module: 2, variant: 0,
    title: "The cleaning funnel",
    hook: "What survives data cleaning?",
    goal: "Start with 1,000 documents. End with 600 (±5).",
    controls: [
      { id: "f", label: "Quality filter rejects", min: 0, max: 0.5, step: 0.05, value: 0.1, unit: "%" },
      { id: "d", label: "Duplicates removed from the rest", min: 0, max: 0.5, step: 0.05, value: 0.1, unit: "%" },
    ],
    sweep: "d",
    scene: ({ f, d }) => {
      const kept = 1000 * (1 - f), left = kept * (1 - d);
      return {
        bars: [
          { label: "raw", value: 1000, max: 1000, tone: "on", text: "1000" },
          { label: "filtered", value: kept, max: 1000, tone: "on", text: kept.toFixed(0) },
          { label: "deduplicated", value: left, max: 1000, tone: "hi", text: left.toFixed(0) },
        ],
        readouts: [[left.toFixed(0), "documents left"]],
      };
    },
    solved: ({ f, d }) => Math.abs(1000 * (1 - f) * (1 - d) - 600) <= 5,
    win: "Each step takes a share of what is left, not of the original.",
    idea: "Cleaning steps chain: each removes a fraction of whatever survived the step before. Deduplicate before you split train and test, or copies leak across.",
    choice: { prompt: "Remove 50%, then 50% of what remains. What is left?", options: ["0%", "25%", "50%"], answer: 1, why: "0.5 × 0.5 = 0.25 of the original." },
    takeaway: "Fractions multiply down the funnel.",
    deeper: "03-01",
    source: { label: "Lee et al., 2021, deduplication", href: "https://arxiv.org/abs/2107.06499" },
  },
  {
    id: "e06", module: 2, variant: 1,
    title: "Mixing the menu",
    hook: "Does a small dataset get drowned out?",
    goal: "Corpus B is 3× bigger. Make one A token as likely as one B token.",
    controls: [{ id: "w", label: "Share of samples drawn from A", min: 0.05, max: 0.95, step: 0.05, value: 0.5, unit: "%" }],
    sweep: "w",
    scene: ({ w }) => {
      const a = w / 1, b = (1 - w) / 3, ratio = a / b;
      return {
        bars: [
          { label: "A (1B tokens)", value: w, max: 1, tone: "on", text: pct(w) },
          { label: "B (3B tokens)", value: 1 - w, max: 1, tone: "on", text: pct(1 - w) },
          { label: "A token ÷ B token", value: Math.min(ratio, 5), max: 5, tone: "hi", text: `${ratio.toFixed(2)}×` },
        ],
        readouts: [[`${ratio.toFixed(2)}×`, "how much likelier each A token is"]],
      };
    },
    solved: ({ w }) => Math.abs(w / (1 - w) * 3 - 1) < 0.05,
    win: "25% to A matches its size: each token is equally likely.",
    idea: "Mixture weights pick a source first, then a token inside it. Sample a small source often and each of its tokens repeats more.",
    choice: { prompt: "Sources sampled 50/50, but B is 3× bigger. An A token is…", options: ["Equally likely", "3× likelier", "3× rarer"], answer: 1, why: "Half the samples spread over a third as many tokens." },
    takeaway: "Source weights ≠ token weights.",
    deeper: "03-01",
  },
  {
    id: "e07", module: 3, variant: 0,
    title: "Batch builder",
    hook: "How do GPUs share one big batch?",
    goal: "Hit a global batch of 256 with a microbatch of 8 or fewer.",
    controls: [
      { id: "g", label: "GPUs", min: 1, max: 8, step: 1, value: 2 },
      { id: "m", label: "Microbatch per GPU", min: 1, max: 16, step: 1, value: 4 },
      { id: "a", label: "Accumulation steps", min: 1, max: 8, step: 1, value: 1 },
    ],
    sweep: "a",
    scene: ({ g, m, a }) => ({
      tokens: range(g * 16, (i) => (i % 16 < Math.min(m * a, 16) ? (i % 16 < m ? "hi" : "on") : "off")),
      columns: 16,
      readouts: [[String(g * m * a), "global batch = GPUs × micro × accum"], [m > 8 ? "too big" : "fits", "microbatch memory"]],
    }),
    solved: ({ g, m, a }) => g * m * a === 256 && m <= 8,
    win: "Accumulation buys batch size with time instead of memory.",
    idea: "Global batch = GPUs × microbatch × accumulation steps. Accumulation adds up gradients over several small passes before one update.",
    choice: { prompt: "Memory is full. To keep the same global batch you can…", options: ["Halve micro, double accumulation", "Double micro", "Drop a GPU"], answer: 0, why: "The product stays the same while each pass holds fewer sequences." },
    takeaway: "Same batch, less memory: accumulate.",
    deeper: "04-01",
  },
  {
    id: "e08", module: 3, variant: 1,
    title: "Will it fit?",
    hook: "How big a model fits on one 24 GB card?",
    goal: "Fit the biggest model you can, leaving at least 4 GB for activations.",
    controls: [{ id: "n", label: "Parameters (millions)", min: 100, max: 2000, step: 50, value: 300 }],
    sweep: "n",
    scene: ({ n }) => {
      const gb = n * 16 / 1000;
      return {
        bars: [
          { label: "weights, grads, Adam", value: Math.min(gb, 24), max: 24, tone: gb > 20 ? "warn" : "on", text: `${gb.toFixed(1)} GB` },
          { label: "left for activations", value: Math.max(0, 24 - gb), max: 24, tone: "hi", text: `${Math.max(0, 24 - gb).toFixed(1)} GB` },
        ],
        readouts: [[`${gb.toFixed(1)} GB`, "16 bytes per parameter"]],
      };
    },
    solved: ({ n }) => n * 16 / 1000 <= 20 && n >= 1200,
    win: "About 1.25B parameters is the ceiling here — before any activations.",
    idea: "Mixed-precision Adam keeps about 16 bytes per parameter: the weights, their gradients and the optimizer's state. Activations come on top.",
    choice: { prompt: "1 billion parameters at 16 bytes each needs about…", options: ["1.6 GB", "16 GB", "160 GB"], answer: 1, why: "1e9 × 16 bytes = 16e9 bytes = 16 GB." },
    takeaway: "Parameters × 16 bytes, then activations.",
    deeper: "04-01",
    source: { label: "Rajbhandari et al., 2019, ZeRO", href: "https://arxiv.org/abs/1910.02054" },
  },
  {
    id: "e09", module: 4, variant: 0,
    title: "Spend the budget",
    hook: "Bigger model or more data?",
    goal: "Spend about 1.2e19 FLOPs (±10%) at 15–25 tokens per parameter.",
    controls: [
      { id: "n", label: "Parameters (millions)", min: 20, max: 1000, step: 10, value: 100 },
      { id: "d", label: "Training tokens (billions)", min: 0.5, max: 30, step: 0.1, value: 2, digits: 1 },
    ],
    sweep: "d",
    scene: ({ n, d }) => {
      const c = flops(n, d), ratio = d * 1000 / n;
      return {
        bars: [
          { label: "compute vs budget", value: Math.min(c / COMPUTE_BUDGET, 2), max: 2, tone: Math.abs(c / COMPUTE_BUDGET - 1) <= 0.1 ? "hi" : "on", text: c.toExponential(2) },
          { label: "tokens per parameter", value: Math.min(ratio, 60), max: 60, tone: ratio >= 15 && ratio <= 25 ? "hi" : "on", text: ratio.toFixed(1) },
        ],
        readouts: [[c.toExponential(2), "FLOPs ≈ 6 × N × D"]],
      };
    },
    solved: ({ n, d }) => Math.abs(flops(n, d) / COMPUTE_BUDGET - 1) <= 0.1 && d * 1000 / n >= 15 && d * 1000 / n <= 25,
    win: "Balanced: roughly 20 tokens for every parameter.",
    idea: "Training compute ≈ 6 × parameters × tokens. Chinchilla found roughly 20 tokens per parameter spent a fixed budget best.",
    choice: { prompt: "Same compute, but you double the parameters. Tokens must…", options: ["Halve", "Double", "Stay the same"], answer: 0, why: "6ND is fixed, so N × 2 forces D ÷ 2." },
    takeaway: "Compute ≈ 6ND; balance N and D.",
    deeper: "05-01",
    source: { label: "Hoffmann et al., 2022", href: "https://arxiv.org/abs/2203.15556" },
  },
  {
    id: "e10", module: 4, variant: 1,
    title: "Don't drop the failures",
    hook: "Can a score lie without a wrong number?",
    goal: "60 of 100 are correct. How many invalid answers would make 'valid-only' accuracy look like 75%?",
    controls: [{ id: "x", label: "Invalid (unparseable) answers", min: 0, max: 40, step: 1, value: 0 }],
    sweep: "x",
    scene: ({ x }) => ({
      tokens: range(100, (i) => (i < 60 ? "on" : i >= 100 - x ? "warn" : "off")),
      columns: 20,
      readouts: [["60.0%", "honest: correct ÷ all 100"], [pct(60 / (100 - x)), "inflated: invalid dropped"]],
    }),
    solved: ({ x }) => x === 20,
    win: "Same model, +15 points, just by shrinking the denominator.",
    idea: "Keep every example in the denominator. Quietly dropping malformed answers inflates a score.",
    choice: { prompt: "An answer can't be parsed. Count it as…", options: ["A failure", "Skip it", "Half credit"], answer: 0, why: "Declare the denominator up front; invalid outputs are failures." },
    takeaway: "Report correct ÷ everything.",
    deeper: "05-01",
  },
  {
    id: "e11", module: 5, variant: 0,
    title: "Who gets graded?",
    hook: "Should the model learn to write the prompt?",
    goal: "20 prompt tokens. Pick a response length where the mask removes exactly 80% of labels.",
    controls: [
      { id: "r", label: "Response tokens", min: 1, max: 20, step: 1, value: 10 },
      { id: "pad", label: "Padding tokens", min: 0, max: 8, step: 1, value: 3 },
    ],
    sweep: "r",
    scene: ({ r, pad }) => ({
      tokens: [...range(20, () => "off" as Tone), ...range(r, () => "hi" as Tone), ...range(pad, () => "warn" as Tone)],
      columns: 16,
      readouts: [[String(r), "labels with assistant-only mask"], [String(20 + r), "labels without it (padding never counts)"]],
    }),
    solved: ({ r }) => r === 5,
    win: "5 of 25: the mask keeps only the answer.",
    idea: "Assistant-only fine-tuning computes loss on response tokens. Prompt and padding positions are masked out.",
    choice: { prompt: "Bright tokens in the strip are…", options: ["Graded by the loss", "Hidden from attention", "Deleted"], answer: 0, why: "The loss mask is not the attention mask; the model still reads the prompt." },
    takeaway: "Grade the answer, not the question.",
    deeper: "06-01",
  },
  {
    id: "e12", module: 5, variant: 1,
    title: "The low-rank shortcut",
    hook: "Can we fine-tune 1% of a matrix?",
    goal: "On a 4096 × 4096 layer, use the highest rank that trains under 1% of it.",
    controls: [{ id: "r", label: "LoRA rank", min: 1, max: 64, step: 1, value: 8 }],
    sweep: "r",
    scene: ({ r }) => {
      const full = 4096 * 4096, lora = r * 2 * 4096, share = lora / full;
      return {
        bars: [{ label: "trained share", value: Math.min(share, 0.04), max: 0.04, tone: share < 0.01 ? "hi" : "warn", text: pct(share) }],
        readouts: [[lora.toLocaleString("en-US"), "adapter parameters = r × (in + out)"], [full.toLocaleString("en-US"), "frozen matrix"]],
      };
    },
    solved: ({ r }) => r === 20,
    win: "Rank 20: 163,840 trainable numbers instead of 16.8 million.",
    idea: "LoRA freezes the big matrix and trains two thin ones, B (d × r) and A (r × d). Their product is a low-rank update.",
    choice: { prompt: "Double the rank. Adapter parameters…", options: ["Double", "Quadruple", "Stay the same"], answer: 0, why: "r × (in + out) is linear in r." },
    takeaway: "Rank sets the size of the update.",
    deeper: "06-01",
    source: { label: "Hu et al., 2021, LoRA", href: "https://arxiv.org/abs/2106.09685" },
  },
  {
    id: "e13", module: 6, variant: 0,
    title: "Bet on the better arm",
    hook: "What is a policy worth?",
    goal: "Arm A pays 3, arm B pays 1. Reach an expected reward of 2.6.",
    controls: [{ id: "p", label: "Probability of choosing A", min: 0, max: 1, step: 0.01, value: 0.3, digits: 2 }],
    sweep: "p",
    scene: ({ p }) => ({
      bars: [
        { label: "choose A (pays 3)", value: p, max: 1, tone: "on", text: pct(p) },
        { label: "choose B (pays 1)", value: 1 - p, max: 1, tone: "off", text: pct(1 - p) },
        { label: "expected reward", value: 1 + 2 * p, max: 3, tone: "hi", text: (1 + 2 * p).toFixed(2) },
      ],
      readouts: [[(1 + 2 * p).toFixed(2), "3p + 1(1 − p)"]],
    }),
    solved: ({ p }) => 1 + 2 * p >= 2.6 - 1e-9,
    win: "Lean on the better arm and the average rises.",
    idea: "A policy is a probability over actions. Expected reward weights each payoff by how often you pick it.",
    choice: { prompt: "p(A) = 0.5. Expected reward is…", options: ["2", "3", "4"], answer: 0, why: "0.5 × 3 + 0.5 × 1 = 2." },
    takeaway: "Value = Σ probability × reward.",
    deeper: "07-01",
  },
  {
    id: "e14", module: 6, variant: 1,
    title: "Where learning is fastest",
    hook: "When does a policy learn most?",
    goal: "Find the probability where the gradient is largest.",
    controls: [{ id: "p", label: "Probability of choosing A", min: 0.01, max: 0.99, step: 0.01, value: 0.9, digits: 2 }],
    sweep: "p",
    scene: ({ p }) => ({
      bars: [{ label: "dJ/dz = 2p(1 − p)", value: 2 * p * (1 - p), max: 0.5, tone: "hi", text: (2 * p * (1 - p)).toFixed(3) }],
      tokens: range(20, (i) => (i / 19 <= p ? "on" : "off")),
      columns: 20,
      readouts: [[(2 * p * (1 - p)).toFixed(3), "gradient on the logit"]],
    }),
    solved: ({ p }) => Math.abs(p - 0.5) <= 0.02,
    win: "Most uncertain → most to learn. A certain policy barely moves.",
    idea: "With a sigmoid policy, the gradient is (reward gap) × p(1 − p). It peaks at p = 0.5 and vanishes as the policy becomes certain.",
    choice: { prompt: "p(A) = 0.99 and A is better. The gradient is…", options: ["Tiny", "Largest", "Negative"], answer: 0, why: "2 × 0.99 × 0.01 ≈ 0.02." },
    takeaway: "Certainty kills the gradient.",
    deeper: "07-01",
  },
  {
    id: "e15", module: 7, variant: 0,
    title: "Preference tug-of-war",
    hook: "How do we learn from 'A is better than B'?",
    goal: "Get the DPO loss under 0.30.",
    controls: [
      { id: "beta", label: "β (strength)", min: 0.05, max: 1, step: 0.05, value: 0.1, digits: 2 },
      { id: "delta", label: "Margin: chosen − rejected (log-ratio)", min: -5, max: 5, step: 0.1, value: 0, digits: 1 },
    ],
    sweep: "delta",
    scene: ({ beta, delta }) => {
      const s = sigmoid(beta * delta), loss = dpoLoss(beta, delta);
      return {
        bars: [
          { label: "σ(β × margin)", value: s, max: 1, tone: "on", text: s.toFixed(3) },
          { label: "loss −ln σ", value: Math.min(loss, 3), max: 3, tone: "warn", text: loss.toFixed(3) },
        ],
        readouts: [[loss.toFixed(3), "DPO loss for this pair"]],
      };
    },
    solved: ({ beta, delta }) => dpoLoss(beta, delta) < 0.3,
    win: "The chosen answer now clearly beats the rejected one.",
    idea: "DPO raises the chosen answer's log-probability relative to the rejected one, both measured against a frozen reference. β sets how strongly.",
    choice: { prompt: "Policy equals the reference, so the margin is 0. Loss is…", options: ["0", "ln 2 ≈ 0.69", "∞"], answer: 1, why: "σ(0) = 0.5 and −ln 0.5 = ln 2." },
    takeaway: "Widen the margin, lower the loss.",
    deeper: "08-01",
    source: { label: "Rafailov et al., 2023, DPO", href: "https://arxiv.org/abs/2305.18290" },
  },
  {
    id: "e16", module: 7, variant: 1,
    title: "Clip it",
    hook: "How far may one update move a policy?",
    goal: "Old probability 0.20. Take the biggest step that is not clipped (ε = 0.2).",
    controls: [{ id: "q", label: "New probability", min: 0.05, max: 0.4, step: 0.01, value: 0.2, digits: 2 }],
    sweep: "q",
    scene: ({ q }) => {
      const ratio = q / 0.2, clipped = Math.min(Math.max(ratio, 0.8), 1.2);
      return {
        bars: [
          { label: "ratio new ÷ old", value: Math.min(ratio, 2), max: 2, tone: ratio > 1.2 + 1e-9 || ratio < 0.8 - 1e-9 ? "warn" : "on", text: ratio.toFixed(2) },
          { label: "after clipping", value: clipped, max: 2, tone: "hi", text: clipped.toFixed(2) },
        ],
        readouts: [[ratio.toFixed(2), "importance ratio"], ["[0.80, 1.20]", "clip range"]],
      };
    },
    solved: ({ q }) => Math.abs(q / 0.2 - 1.2) < 1e-6,
    win: "Ratio 1.2: right at the edge. Any further and the gain is clipped.",
    idea: "PPO's ratio is new probability ÷ the probability when the sample was collected. Clipping it to 1 ± ε stops one batch moving the policy too far.",
    choice: { prompt: "The ratio divides by the probability from…", options: ["The rollout policy", "The reference model", "A uniform guess"], answer: 0, why: "Importance ratios compare to the policy that generated the sample." },
    takeaway: "Small, trusted steps.",
    deeper: "08-01",
    source: { label: "Schulman et al., 2017, PPO", href: "https://arxiv.org/abs/1707.06347" },
  },
  {
    id: "e17", module: 8, variant: 0,
    title: "Graded on a curve",
    hook: "How do you score answers without a critic?",
    goal: "Give the first answer an advantage of at least 1.5.",
    controls: [1, 2, 3, 4].map((i) => ({ id: `r${i}`, label: `Answer ${i} correct`, min: 0, max: 1, step: 1, value: 1, toggle: true })),
    sweep: "r1",
    scene: (v) => {
      const { mean, sd, adv } = groupAdvantages(v);
      return {
        bars: adv.map((a, i) => ({ label: `answer ${i + 1}`, value: Math.abs(a), max: 2, tone: a > 0 ? "hi" : a < 0 ? "warn" : "off", text: a.toFixed(2) })),
        readouts: [[mean.toFixed(2), "group mean reward"], [sd.toFixed(2), "group std"]],
      };
    },
    solved: (v) => groupAdvantages(v).adv[0] >= 1.5,
    win: "The lone correct answer stands out the most.",
    idea: "GRPO samples a group of answers and scores each against the group's average. If every answer ties, there is no signal.",
    choice: { prompt: "All four answers are correct. Advantages are…", options: ["All zero", "All positive", "All 1"], answer: 0, why: "Each reward equals the mean, so there is nothing to prefer." },
    takeaway: "Advantage = better than your siblings.",
    deeper: "09-01",
    source: { label: "Shao et al., 2024, DeepSeekMath", href: "https://arxiv.org/abs/2402.03300" },
  },
  {
    id: "e18", module: 8, variant: 1,
    title: "One shot or many?",
    hook: "Can a weak model look strong?",
    goal: "Make pass@k at least 90% while pass@1 stays at 30% or below.",
    controls: [
      { id: "p", label: "Chance one sample is right", min: 0.05, max: 0.9, step: 0.05, value: 0.3, digits: 2 },
      { id: "k", label: "Samples allowed (k)", min: 1, max: 16, step: 1, value: 1 },
    ],
    sweep: "k",
    scene: ({ p, k }) => {
      const passK = 1 - (1 - p) ** k;
      return {
        bars: [
          { label: "pass@1", value: p, max: 1, tone: "on", text: pct(p) },
          { label: `pass@${k}`, value: passK, max: 1, tone: "hi", text: pct(passK) },
        ],
        readouts: [[pct(passK), "1 − (1 − p)^k"]],
      };
    },
    solved: ({ p, k }) => p <= 0.3 + 1e-9 && 1 - (1 - p) ** k >= 0.9,
    win: "Many tries hide a model that is usually wrong.",
    idea: "pass@1 asks if the first answer is right. pass@k asks if any of k answers is right — a different, easier question.",
    choice: { prompt: "A paper reports pass@16. You care about single answers. You should…", options: ["Ask for pass@1", "Trust pass@16", "Average them"], answer: 0, why: "Report the metric that matches how the model will be used." },
    takeaway: "Name the k.",
    deeper: "09-01",
    source: { label: "Chen et al., 2021, Codex", href: "https://arxiv.org/abs/2107.03374" },
  },
  {
    id: "e19", module: 9, variant: 0,
    title: "Is it real?",
    hook: "One good run — is that a result?",
    goal: "Seed noise is 2 points. Find the fewest seeds where a 1-point gain clears 2 standard errors.",
    controls: [{ id: "n", label: "Paired seeds", min: 1, max: 32, step: 1, value: 3 }],
    sweep: "n",
    scene: ({ n }) => {
      const se = 2 / Math.sqrt(n);
      return {
        bars: [
          { label: "effect", value: 1, max: 4, tone: "on", text: "1.00" },
          { label: "2 × standard error", value: Math.min(2 * se, 4), max: 4, tone: 2 * se <= 1 ? "hi" : "warn", text: (2 * se).toFixed(2) },
        ],
        readouts: [[(2 * se).toFixed(2), "2 × 2 / √seeds"]],
      };
    },
    solved: ({ n }) => n === 16,
    win: "16 seeds. Small effects need many runs.",
    idea: "Run several seeds and compare paired differences. An effect smaller than its noise is not a finding yet.",
    choice: { prompt: "To halve the standard error you need…", options: ["4× the seeds", "2× the seeds", "1 more seed"], answer: 0, why: "Error shrinks with √n." },
    takeaway: "Noise first, then claims.",
    deeper: "10-01",
    source: { label: "Henderson et al., 2018", href: "https://arxiv.org/abs/1709.06560" },
  },
  {
    id: "e20", module: 9, variant: 1,
    title: "Count the bill",
    hook: "What did that experiment cost?",
    goal: "Get at least 40 GPU-hours, finish within 6 wall hours, spend ≤ $100 at an example $2/GPU-hour.",
    controls: [
      { id: "g", label: "GPUs", min: 1, max: 16, step: 1, value: 2 },
      { id: "h", label: "Wall hours", min: 1, max: 24, step: 1, value: 10 },
    ],
    sweep: "g",
    scene: ({ g, h }) => ({
      tokens: range(g * h > 96 ? 96 : g * h, () => "on" as Tone),
      columns: 16,
      readouts: [[String(g * h), "GPU-hours = GPUs × hours"], [`$${g * h * 2}`, "at the example rate"], [`${h} h`, "wall clock"]],
    }),
    solved: ({ g, h }) => g * h >= 40 && h <= 6 && g * h * 2 <= 100,
    win: "More GPUs shorten the wait, not the bill.",
    idea: "GPU-hours = GPUs × wall hours. Report them so others can judge the cost and reproduce the run.",
    choice: { prompt: "8 GPUs for 3 hours vs 24 GPUs for 1 hour. GPU-hours…", options: ["Equal", "First is more", "Second is more"], answer: 0, why: "Both are 24 GPU-hours." },
    takeaway: "Report GPU-hours.",
    deeper: "10-01",
  },
];

/** Episode ids grouped by module, for season badges. */
export const episodesByModule = () => {
  const map = new Map<number, string[]>();
  for (const e of episodes) map.set(e.module, [...(map.get(e.module) ?? []), e.id]);
  return map;
};

export const initialValues = (e: Episode): Values => Object.fromEntries(e.controls.map((c) => [c.id, c.value]));
