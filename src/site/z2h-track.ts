// The Zero to Hero companion track.
//
// One entry per lecture in Andrej Karpathy's public "Neural Networks: Zero to
// Hero" series. We link to his videos and repositories and add our own study
// plan, interactive panel, runnable sample, and course mapping. Nothing from
// those videos or notebooks is reproduced here.
//
// Video identifiers and repository links were taken from the lecture list in
// karpathy/nn-zero-to-hero (lectures 1–8) and karpathy/build-nanogpt
// (lecture 9), checked 2026-09-12. See docs/zero-to-hero/licensing.md for the
// license status of each referenced work.

import type { PanelKind } from "./z2h-panels.ts";

export interface TrackLink {
  label: string;
  url: string;
  note?: string;
}

export interface Lecture {
  id: string;
  number: number;
  title: string;
  /** YouTube identifier, used for the opt-in embed and the direct link. */
  video: string;
  /** The mechanism the lecture establishes, in one sentence. */
  focus: string;
  /** What you should be able to do afterwards, independently. */
  outcome: string;
  panel: PanelKind;
  /** Guide filename inside docs/zero-to-hero/. */
  guide: string;
  /** Course modules this lecture feeds, by index into content.ts modules. */
  courseModules: { moduleIndex: number; why: string }[];
  labs: string[];
  links: TrackLink[];
  sample: { description: string; code: string };
}

const ZERO_TO_HERO_REPO: TrackLink = {
  label: "nn-zero-to-hero (lecture notebooks)",
  url: "https://github.com/karpathy/nn-zero-to-hero",
  note: "MIT licensed",
};

export const lectures: Lecture[] = [
  {
    id: "l1",
    number: 1,
    title: "The spelled-out intro to neural networks and backpropagation: building micrograd",
    video: "VMj-3S1tku0",
    focus:
      "A derivative is a local rule, and reverse mode applies those rules once per node in the opposite order to the forward pass.",
    outcome:
      "Write a scalar autograd engine from nothing, and prove its gradients against finite differences instead of trusting a falling loss.",
    panel: "autograd",
    guide: "l1-micrograd.md",
    courseModules: [{ moduleIndex: 0, why: "Autograd, loss, and the verified training loop are module 1's entire subject." }],
    labs: ["01-01", "01-02"],
    links: [
      { label: "micrograd repository", url: "https://github.com/karpathy/micrograd", note: "MIT licensed" },
      ZERO_TO_HERO_REPO,
      { label: "Automatic differentiation (Dive into Deep Learning)", url: "https://d2l.ai/chapter_preliminaries/autograd.html" },
    ],
    sample: {
      description:
        "Compose a graph the way the exercise does, call backward, and check every gradient against a central difference. JavaScript has no operator overloading, so a * b + c is written a.mul(b).add(c) — the mechanism is the one you will write in Python.",
      code: `const a = z2h.value(1.5, "a"), b = z2h.value(-2, "b"), c = z2h.value(0.5, "c");
const loss = a.mul(b).add(c).mul(a.tanh());   // (a*b + c) * tanh(a)
loss.backward();
print("value", loss.data, "grads", { a: a.grad, b: b.grad, c: c.grad });

// The same formula through the typed-expression engine, as a second opinion.
print("expression engine", z2h.backpropagate(z2h.parseExpression("(a*b + c) * tanh(a)"),
                                             { a: 1.5, b: -2, c: 0.5 }).grads);

// Every operation against central differences, the check your version needs.
const check = z2h.checkValueGradients(([p, q]) => p.mul(q).add(p.tanh()).relu(), [0.7, -1.3]);
print("largest analytic vs numeric gap", check.maxError);

// Four examples, one small network, trained by plain gradient descent.
const fit = z2h.fitNetwork(new z2h.Network([2, 4, 4, 1], 3), [
  { inputs: [2, 3], target: 1 }, { inputs: [3, -1], target: -1 },
  { inputs: [0.5, 1], target: -1 }, { inputs: [1, 1], target: 1 },
], { steps: 150, learningRate: 0.06 });
print("loss", fit.lossHistory[0], "->", fit.finalLoss, "predictions", fit.predictions);

// Now pass clearGradients: false and explain the number you get.
return z2h.valueTrace(loss).nodes.map(n => [n.label || n.op, n.value, n.grad]);`,
    },
  },
  {
    id: "l2",
    number: 2,
    title: "The spelled-out intro to language modeling: building makemore",
    video: "PaCmpygFfXo",
    focus:
      "Language modelling is next-symbol prediction; counting pairs already gives a model, and its negative log likelihood is the number every later model must beat.",
    outcome:
      "Build a bigram model two ways — counts and a trained single layer — and explain why they reach nearly the same loss.",
    panel: "bigram",
    guide: "l2-bigram.md",
    courseModules: [
      { moduleIndex: 0, why: "Cross-entropy, sampling, and a baseline you can beat are the foundations module's tools." },
      { moduleIndex: 1, why: "The same objective scales up to the decoder you build in module 2." },
    ],
    labs: ["01-01", "02-04"],
    links: [
      { label: "makemore repository", url: "https://github.com/karpathy/makemore", note: "MIT licensed" },
      ZERO_TO_HERO_REPO,
    ],
    sample: {
      description:
        "Count bigrams, measure the loss against the uniform baseline, and sample words to hear what a first-order model can and cannot do.",
      code: `const model = z2h.trainBigram(data.NAMES, 1);
print("vocabulary", model.characters.length);
print("loss", model.loss, "uniform baseline", z2h.uniformLoss(model.characters.length));
const random = z2h.rng(3);
print("samples", Array.from({ length: 8 }, () => z2h.sampleBigram(model, random)).join(" "));
// Raise the smoothing to 5 and explain the direction the loss moves.
return z2h.trainBigram(data.NAMES, 5).loss - model.loss;`,
    },
  },
  {
    id: "l3",
    number: 3,
    title: "Building makemore Part 2: MLP",
    video: "TCH_1BHY58I",
    focus:
      "An embedding table plus one hidden layer generalises across contexts that counting cannot reach, and introduces every practical training control at once.",
    outcome:
      "Train a context-window MLP, split train/dev/test honestly, tune a learning rate by evidence, and report the train–held-out gap.",
    panel: "mlp",
    guide: "l3-mlp.md",
    courseModules: [
      { moduleIndex: 0, why: "Learning-rate search, over- and underfitting, and split discipline belong to module 1." },
      { moduleIndex: 4, why: "Honest held-out reporting is the habit module 5 formalises." },
    ],
    labs: ["01-02", "01-04"],
    links: [
      { label: "makemore repository", url: "https://github.com/karpathy/makemore", note: "MIT licensed" },
      { label: "A Neural Probabilistic Language Model (Bengio et al., 2003)", url: "https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf" },
    ],
    sample: {
      description:
        "Train the browser MLP at two learning rates and compare training loss, held-out loss, and the bigram baseline.",
      code: `for (const learningRate of [0.1, 0.4, 1.2]) {
  const run = z2h.trainCharMLP({ words: data.NAMES, steps: 300, learningRate, seed: 4 });
  print("lr", learningRate, "train", run.trainLoss.toFixed(3),
        "held-out", run.heldOutLoss.toFixed(3), "params", run.parameters);
}
// Which learning rate wins on training loss, and does the same one win on
// held-out loss? Report both numbers or neither.
return "compare the two columns, not the loss curve";`,
    },
  },
  {
    id: "l4",
    number: 4,
    title: "Building makemore Part 3: Activations & Gradients, BatchNorm",
    video: "P6sfmUTpUmc",
    focus:
      "Initialisation scale decides whether activations saturate and whether gradients survive the trip back; normalisation removes much of that dependence.",
    outcome:
      "Diagnose a network from its activation and gradient statistics before training it, and explain what batch normalisation fixes and what it costs.",
    panel: "activations",
    guide: "l4-activations.md",
    courseModules: [
      { moduleIndex: 0, why: "Diagnosing a failing training run is module 1's failure-diagnosis lab." },
      { moduleIndex: 1, why: "Norm placement in a decoder block is a module 2 decision." },
    ],
    labs: ["01-04", "02-03"],
    links: [
      { label: "Understanding the difficulty of training deep feedforward networks (Glorot & Bengio, 2010)", url: "https://proceedings.mlr.press/v9/glorot10a/glorot10a.pdf" },
      { label: "Batch Normalization (Ioffe & Szegedy, 2015)", url: "https://arxiv.org/abs/1502.03167" },
      { label: "Delving Deep into Rectifiers (He et al., 2015)", url: "https://arxiv.org/abs/1502.01852" },
    ],
    sample: {
      description:
        "Sweep the initialisation gain and watch saturation and gradient magnitude move together, then switch normalisation on.",
      code: `for (const gain of [0.4, 1.0, 2.5]) {
  const report = z2h.initialisationDiagnostics({ gain, depth: 5 });
  const last = report.layers[report.layers.length - 1];
  print("gain", gain, "activation std", last.activationStd.toFixed(3),
        "saturated", (100 * last.saturatedFraction).toFixed(1) + "%",
        "first-layer grad std", report.layers[0].gradientStd.toExponential(2));
}
const normalised = z2h.initialisationDiagnostics({ gain: 2.5, depth: 5, normalised: true });
print("normalised saturation", normalised.layers.map(l => l.saturatedFraction.toFixed(2)).join(" "));
return normalised.layers.map(l => l.activationStd);`,
    },
  },
  {
    id: "l5",
    number: 5,
    title: "Building makemore Part 4: Becoming a Backprop Ninja",
    video: "q8SA3rM6ckI",
    focus:
      "Differentiating a whole layer stack by hand, at tensor level, turns backpropagation from a library call into something you can audit.",
    outcome:
      "Derive the backward pass of cross-entropy, a linear layer, tanh, normalisation, and an embedding lookup, and check each against autograd.",
    panel: "gradcheck",
    guide: "l5-backprop.md",
    courseModules: [
      { moduleIndex: 0, why: "Gradient verification is the first foundations lab and the habit everything later depends on." },
      { moduleIndex: 3, why: "Custom kernels in module 4 need a hand-derived backward pass and a check for it." },
    ],
    labs: ["01-01", "04-03"],
    links: [
      ZERO_TO_HERO_REPO,
      { label: "Exercise notebook linked from the lecture repository", url: "https://colab.research.google.com/drive/1WV2oi2fh9XXyldh02wupFQX0wh5ZC-z-", note: "hosted notebook; work it before watching the answers" },
    ],
    sample: {
      description:
        "Run the check with a correct derivation, then with three classic mistakes. Note which tensors each mistake leaves looking fine.",
      code: `for (const rule of ["correct", "no-batch-mean", "no-onehot", "transposed-hidden"]) {
  const check = z2h.gradientCheck(rule);
  print(rule.padEnd(18), check.passed ? "passes" : "fails",
        check.entries.map(e => e.name + ":" + e.maxError.toExponential(1)).join(" "));
}
// One of these fails only in the earlier layer. Which mistake would you have
// caught from the loss curve alone?
return z2h.gradientCheck("transposed-hidden").entries;`,
    },
  },
  {
    id: "l6",
    number: 6,
    title: "Building makemore Part 5: Building a WaveNet",
    video: "t3YJ5hKiMQ0",
    focus:
      "Context can be combined hierarchically instead of concatenated into one wide layer, and building that requires reading shapes carefully at every level.",
    outcome:
      "Restructure a flat context model into levels, keep the tensor shapes straight, and justify the parameter cost you chose.",
    panel: "hierarchy",
    guide: "l6-wavenet.md",
    courseModules: [
      { moduleIndex: 0, why: "Convolution and shape discipline are covered by the foundations convolution lab." },
      { moduleIndex: 1, why: "Module 2 asks you to keep every shape in a decoder explicit." },
    ],
    labs: ["01-03", "02-02"],
    links: [
      { label: "WaveNet (van den Oord et al., 2016)", url: "https://arxiv.org/abs/1609.03499" },
      ZERO_TO_HERO_REPO,
    ],
    sample: {
      description:
        "Compare a single wide layer against a hierarchy as the context grows, and locate the context length where the hierarchy wins.",
      code: `const plan = z2h.contextPlan({ fanIn: 2, depth: 4, hidden: 64, embedding: 16 });
print("context", plan.contextLength, "groups per level", plan.groupsPerLayer.join(","));
for (const point of plan.scaling) {
  print("context", String(point.contextLength).padStart(3),
        "one wide layer", point.flat, "hierarchy", point.hierarchical);
}
const crossover = plan.scaling.find(p => p.hierarchical < p.flat);
print("hierarchy becomes cheaper at", crossover ? crossover.contextLength : "a longer context");
return crossover;`,
    },
  },
  {
    id: "l7",
    number: 7,
    title: "Let's build GPT: from scratch, in code, spelled out.",
    video: "kCc8FmEb1nY",
    focus:
      "Attention is a weighted average whose weights are computed from the data, and a causal mask is what makes next-token training honest.",
    outcome:
      "Implement a small decoder — attention, multiple heads, residual connections, normalisation — and test that no position can see the future.",
    panel: "attention",
    guide: "l7-gpt.md",
    courseModules: [
      { moduleIndex: 1, why: "This is module 2's build: a causal decoder with an attention-parity test." },
      { moduleIndex: 2, why: "Module 3 pretrains the architecture you build here." },
    ],
    labs: ["02-02", "02-03", "02-04"],
    links: [
      { label: "Attention Is All You Need (Vaswani et al., 2017)", url: "https://arxiv.org/abs/1706.03762" },
      { label: "nanoGPT repository", url: "https://github.com/karpathy/nanoGPT", note: "MIT licensed" },
      { label: "Language Models are Unsupervised Multitask Learners (GPT-2)", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf" },
    ],
    sample: {
      description:
        "Compute one attention head, check that each row of weights sums to one, then remove the mask and watch earlier outputs change.",
      code: `const tokens = ["the", "cat", "sat", "on", "the", "mat"];
for (const causal of [true, false]) {
  const head = z2h.selfAttention({ tokens, causal, headDim: 8 });
  print(causal ? "causal " : "no mask",
        "row sums", head.rowSums.map(s => s.toFixed(6)).join(" "),
        "drift in earlier outputs", z2h.causalDrift({ tokens, causal }).toExponential(2));
}
// The causal drift must be exactly zero. That assertion belongs in your test
// suite before you train anything.
return z2h.selfAttention({ tokens, causal: true }).weights;`,
    },
  },
  {
    id: "l8",
    number: 8,
    title: "Let's build the GPT Tokenizer",
    video: "zduSFxRajkE",
    focus:
      "The tokenizer is a separate model with its own training data, and many odd language-model behaviours are inherited from it.",
    outcome:
      "Train byte-pair merges, encode and decode losslessly, and predict which inputs your vocabulary will handle badly.",
    panel: "tokenizer",
    guide: "l8-tokenizer.md",
    courseModules: [
      { moduleIndex: 1, why: "Module 2's first lab is a reversible tokenizer with a small BPE vocabulary." },
      { moduleIndex: 2, why: "Tokenisation decisions change the token budget you account for in module 3." },
    ],
    labs: ["02-01"],
    links: [
      { label: "minbpe repository", url: "https://github.com/karpathy/minbpe", note: "MIT licensed" },
      { label: "Neural Machine Translation of Rare Words with Subword Units (Sennrich et al., 2015)", url: "https://arxiv.org/abs/1508.07909" },
      { label: "Exercise notebook linked from the lecture repository", url: "https://colab.research.google.com/drive/1y0KnCFZvGVf_odSfcNAws6kcDD7HsI0L" },
    ],
    sample: {
      description:
        "Train merges on a text you control, then encode strings the training text never covered and inspect the damage.",
      code: `const model = z2h.trainBPE(data.TOKENIZER_SAMPLE, 32);
print("vocabulary", model.vocabularySize, "compression", model.compression.toFixed(2) + "x");
for (const probe of ["the tokenizer", " tokenizer", "TOKENIZER", "1234", "café", "    indented"]) {
  const ids = z2h.encodeBPE(model, probe);
  print(JSON.stringify(probe).padEnd(16), ids.length, "tokens",
        JSON.stringify(z2h.tokenPieces(model, ids)),
        z2h.decodeBPE(model, ids) === probe ? "round trip exact" : "ROUND TRIP BROKEN");
}
return model.merges.slice(0, 8);`,
    },
  },
  {
    id: "l9",
    number: 9,
    title: "Let's reproduce GPT-2 (124M)",
    video: "l8pRSuU81PU",
    focus:
      "Reproducing a published model is a systems and bookkeeping exercise: exact parameter counts, data throughput, schedules, and measured utilisation.",
    outcome:
      "Plan a run from parameter count and token budget, state the compute and cost before starting, then compare your measurement with the plan.",
    panel: "budget",
    guide: "l9-gpt2.md",
    courseModules: [
      { moduleIndex: 2, why: "Module 3 runs a matched-budget pretraining study with checkpointing." },
      { moduleIndex: 3, why: "Module 4 measures throughput, memory, and distributed behaviour." },
      { moduleIndex: 4, why: "Module 5 turns budgets into scaling and evaluation decisions." },
    ],
    labs: ["03-05", "03-06", "04-01", "05-01"],
    links: [
      { label: "build-nanogpt repository", url: "https://github.com/karpathy/build-nanogpt", note: "no license file as of 2026-09-12: read it, do not copy it" },
      { label: "nanoGPT repository", url: "https://github.com/karpathy/nanoGPT", note: "MIT licensed" },
      { label: "Scaling Laws for Neural Language Models (Kaplan et al., 2020)", url: "https://arxiv.org/abs/2001.08361" },
      { label: "Training Compute-Optimal Large Language Models (Hoffmann et al., 2022)", url: "https://arxiv.org/abs/2203.15556" },
    ],
    sample: {
      description:
        "Check the parameter count of the published configuration, then price your own run and compare it with the 20-tokens-per-parameter guideline.",
      code: `const counts = z2h.parameterCount({ layers: 12, width: 768, vocabulary: 50257, context: 1024 });
print("total parameters", counts.total);
const budget = z2h.trainingBudget({
  parameters: counts.total, tokens: 10e9,
  deviceTflops: 400 * 8, utilisation: 0.4, dollarsPerHour: 2 * 8,
});
print("FLOPs", budget.flops.toExponential(2), "hours", budget.hours.toFixed(2),
      "dollars", budget.dollars.toFixed(0));
print("tokens per parameter", budget.tokensPerParameter.toFixed(1),
      "vs 20 per parameter =", budget.chinchillaOptimalTokens.toExponential(2), "tokens");
// These are estimates from 6 * parameters * tokens. Measure your own tokens per
// second on one device before you trust the hours.
return budget;`,
    },
  },
];
