// Numerics for the Zero to Hero companion track.
//
// Every routine here is an original implementation written for this course so
// that the workbench can compute the quantities a learner is about to build in
// Python. No code from the referenced lectures, notebooks, or repositories is
// copied; the mechanisms are re-derived from their published descriptions and
// from the primary papers cited in docs/06-resources.md.
//
// Constraints: deterministic (seeded) results so tests and lessons agree, plain
// arrays so results survive structuredClone into the sandbox worker, and small
// enough to run inside a browser frame budget.

/** Deterministic 32-bit generator; identical output in tests and the browser. */
export function rng(seed = 1): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal samples from a uniform generator (Box–Muller). */
export function gaussian(random: () => number): number {
  const u = Math.max(random(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

export function softmaxRow(scores: number[]): number[] {
  const top = Math.max(...scores);
  const exponentials = scores.map((s) => Math.exp(s - top));
  const total = exponentials.reduce((a, b) => a + b, 0);
  return exponentials.map((e) => e / total);
}

// ---------------------------------------------------------------------------
// Lecture 1 — scalar reverse-mode autograd over a typed expression
// ---------------------------------------------------------------------------

export type Expression =
  | { kind: "number"; value: number }
  | { kind: "variable"; name: string }
  | { kind: "binary"; op: "+" | "-" | "*" | "/" | "^"; left: Expression; right: Expression }
  | { kind: "call"; fn: string; argument: Expression };

export const UNARY_FUNCTIONS: Record<string, (x: number) => [number, number]> = {
  // Each entry returns [value, local derivative] so forward and backward stay
  // in one place and cannot drift apart.
  tanh: (x) => {
    const t = Math.tanh(x);
    return [t, 1 - t * t];
  },
  exp: (x) => {
    const e = Math.exp(x);
    return [e, e];
  },
  log: (x) => [Math.log(x), 1 / x],
  relu: (x) => [Math.max(0, x), x > 0 ? 1 : 0],
  sigmoid: (x) => {
    const s = 1 / (1 + Math.exp(-x));
    return [s, s * (1 - s)];
  },
};

/** Recursive-descent parser: + - * / ^, unary minus, calls, parentheses. */
export function parseExpression(source: string): Expression {
  const tokens = source.match(/[A-Za-z_][A-Za-z_0-9]*|\d+(?:\.\d+)?|[-+*/^()]/g) || [];
  let position = 0;
  const peek = () => tokens[position];
  const take = (expected?: string) => {
    const token = tokens[position++];
    if (expected && token !== expected) throw new Error(`Expected ${expected} but found ${token ?? "end of expression"}`);
    return token;
  };
  function sum(): Expression {
    let left = product();
    while (peek() === "+" || peek() === "-") {
      const op = take() as "+" | "-";
      left = { kind: "binary", op, left, right: product() };
    }
    return left;
  }
  function product(): Expression {
    let left = power();
    while (peek() === "*" || peek() === "/") {
      const op = take() as "*" | "/";
      left = { kind: "binary", op, left, right: power() };
    }
    return left;
  }
  function power(): Expression {
    const base = unary();
    if (peek() !== "^") return base;
    take("^");
    return { kind: "binary", op: "^", left: base, right: power() };
  }
  function unary(): Expression {
    if (peek() === "-") {
      take("-");
      return { kind: "binary", op: "*", left: { kind: "number", value: -1 }, right: unary() };
    }
    return atom();
  }
  function atom(): Expression {
    const token = take();
    if (token === undefined) throw new Error("The expression ended early");
    if (token === "(") {
      const inner = sum();
      take(")");
      return inner;
    }
    if (/^\d/.test(token)) return { kind: "number", value: Number(token) };
    if (/^[A-Za-z_]/.test(token)) {
      if (peek() === "(") {
        if (!UNARY_FUNCTIONS[token]) throw new Error(`Unknown function ${token}`);
        take("(");
        const argument = sum();
        take(")");
        return { kind: "call", fn: token, argument };
      }
      return { kind: "variable", name: token };
    }
    throw new Error(`Unexpected token ${token}`);
  }
  const parsed = sum();
  if (position !== tokens.length) throw new Error(`Unused input after position ${position}`);
  return parsed;
}

export interface TraceNode {
  id: number;
  label: string;
  op: string;
  value: number;
  grad: number;
  inputs: number[];
  depth: number;
}

export interface Trace {
  nodes: TraceNode[];
  value: number;
  grads: Record<string, number>;
}

/**
 * Forward pass records every intermediate value; the reverse pass walks the
 * same list backwards. A variable used twice becomes one node, so its gradient
 * accumulates from both branches — the property hand-written derivatives miss.
 */
export function backpropagate(expression: Expression, variables: Record<string, number>): Trace {
  const nodes: TraceNode[] = [];
  const backward: ((grad: number) => void)[] = [];
  const variableNodes = new Map<string, number>();
  const push = (label: string, op: string, value: number, inputs: number[], back: (grad: number) => void) => {
    const depth = inputs.length ? Math.max(...inputs.map((i) => nodes[i].depth)) + 1 : 0;
    nodes.push({ id: nodes.length, label, op, value, grad: 0, inputs, depth });
    backward.push(back);
    return nodes.length - 1;
  };
  const addGrad = (id: number, amount: number) => {
    nodes[id].grad += amount;
  };
  function visit(node: Expression): number {
    if (node.kind === "number") return push(String(node.value), "const", node.value, [], () => {});
    if (node.kind === "variable") {
      const existing = variableNodes.get(node.name);
      if (existing !== undefined) return existing;
      if (!(node.name in variables)) throw new Error(`No value supplied for ${node.name}`);
      const id = push(node.name, "input", variables[node.name], [], () => {});
      variableNodes.set(node.name, id);
      return id;
    }
    if (node.kind === "call") {
      const argument = visit(node.argument);
      const [value, local] = UNARY_FUNCTIONS[node.fn](nodes[argument].value);
      return push(node.fn, node.fn, value, [argument], (grad) => addGrad(argument, grad * local));
    }
    const left = visit(node.left);
    const right = visit(node.right);
    const a = nodes[left].value;
    const b = nodes[right].value;
    const rules: Record<string, [number, (grad: number) => void]> = {
      "+": [a + b, (grad) => {
        addGrad(left, grad);
        addGrad(right, grad);
      }],
      "-": [a - b, (grad) => {
        addGrad(left, grad);
        addGrad(right, -grad);
      }],
      "*": [a * b, (grad) => {
        addGrad(left, grad * b);
        addGrad(right, grad * a);
      }],
      "/": [a / b, (grad) => {
        addGrad(left, grad / b);
        addGrad(right, (-grad * a) / (b * b));
      }],
      "^": [a ** b, (grad) => {
        addGrad(left, grad * b * a ** (b - 1));
        if (a > 0) addGrad(right, grad * a ** b * Math.log(a));
      }],
    };
    const [value, back] = rules[node.op];
    return push(node.op, node.op, value, [left, right], back);
  }
  const output = visit(expression);
  nodes[output].grad = 1;
  for (let i = nodes.length - 1; i >= 0; i--) backward[i](nodes[i].grad);
  const grads: Record<string, number> = {};
  for (const [name, id] of variableNodes) grads[name] = nodes[id].grad;
  return { nodes, value: nodes[output].value, grads };
}

/** Central difference, the check that keeps a hand-derived rule honest. */
export function numericGradient(
  expression: Expression,
  variables: Record<string, number>,
  name: string,
  step = 1e-5,
): number {
  const shifted = (delta: number) =>
    backpropagate(expression, { ...variables, [name]: variables[name] + delta }).value;
  return (shifted(step) - shifted(-step)) / (2 * step);
}

// ---------------------------------------------------------------------------
// Lecture 1, second form — the same autograd as an object you compose
// ---------------------------------------------------------------------------
//
// The expression engine above parses text, which suits a panel where a learner
// types a formula. The exercise itself is different: you build a graph by
// composing objects, call backward on the result, and read each leaf's
// gradient. This is that form, so a sample here can mirror the Python you are
// asked to write. JavaScript has no operator overloading, so the operations are
// methods — a.mul(b).add(c) where Python writes a * b + c.

/** One scalar in a graph: its value, its gradient, and how it was produced. */
export class Value {
  data: number;
  grad = 0;
  label: string;
  readonly children: Value[];
  readonly op: string;
  /** Applies this node's local rules to its children's gradients. */
  private readonly propagate: (self: Value) => void;
  constructor(
    data: number,
    label = "",
    children: Value[] = [],
    op = "input",
    propagate: (self: Value) => void = () => {},
  ) {
    this.data = data;
    this.label = label;
    this.children = children;
    this.op = op;
    this.propagate = propagate;
  }

  static of(other: Value | number): Value {
    return other instanceof Value ? other : new Value(other, String(other), [], "const");
  }

  add(other: Value | number): Value {
    const right = Value.of(other);
    return new Value(this.data + right.data, "", [this, right], "+", (self) => {
      this.grad += self.grad;
      right.grad += self.grad;
    });
  }

  mul(other: Value | number): Value {
    const right = Value.of(other);
    return new Value(this.data * right.data, "", [this, right], "*", (self) => {
      this.grad += self.grad * right.data;
      right.grad += self.grad * this.data;
    });
  }

  /** Constant exponent only: the derivative in the exponent needs data > 0. */
  pow(exponent: number): Value {
    return new Value(this.data ** exponent, "", [this], `^${exponent}`, (self) => {
      this.grad += self.grad * exponent * this.data ** (exponent - 1);
    });
  }

  neg(): Value {
    return this.mul(-1);
  }

  sub(other: Value | number): Value {
    return this.add(Value.of(other).neg());
  }

  div(other: Value | number): Value {
    return this.mul(Value.of(other).pow(-1));
  }

  tanh(): Value {
    const t = Math.tanh(this.data);
    return new Value(t, "", [this], "tanh", (self) => {
      this.grad += self.grad * (1 - t * t);
    });
  }

  exp(): Value {
    const e = Math.exp(this.data);
    return new Value(e, "", [this], "exp", (self) => {
      this.grad += self.grad * e;
    });
  }

  log(): Value {
    return new Value(Math.log(this.data), "", [this], "log", (self) => {
      this.grad += self.grad / this.data;
    });
  }

  relu(): Value {
    return new Value(Math.max(0, this.data), "", [this], "relu", (self) => {
      this.grad += this.data > 0 ? self.grad : 0;
    });
  }

  sigmoid(): Value {
    const s = 1 / (1 + Math.exp(-this.data));
    return new Value(s, "", [this], "sigmoid", (self) => {
      this.grad += self.grad * s * (1 - s);
    });
  }

  /** Every node reachable from here, children before the nodes that use them. */
  topologicalOrder(): Value[] {
    const ordered: Value[] = [];
    const seen = new Set<Value>();
    const visit = (node: Value) => {
      if (seen.has(node)) return;
      seen.add(node);
      for (const child of node.children) visit(child);
      ordered.push(node);
    };
    visit(this);
    return ordered;
  }

  /**
   * Seed this node with gradient 1 and walk the graph in reverse. Gradients
   * accumulate, so two calls without zeroGrad double them — the behaviour a
   * training loop must clear between steps.
   */
  backward(): this {
    const ordered = this.topologicalOrder();
    this.grad = 1;
    for (let i = ordered.length - 1; i >= 0; i--) ordered[i].propagate(ordered[i]);
    return this;
  }

  zeroGrad(): this {
    for (const node of this.topologicalOrder()) node.grad = 0;
    return this;
  }
}

export const value = (data: number, label = ""): Value => new Value(data, label);

/** Sum a list without writing a fold at every call site. */
export function sumValues(values: (Value | number)[]): Value {
  return values.reduce<Value>((total, item) => total.add(item), new Value(0, "", [], "const"));
}

/** Render a composed graph with the same figure the expression panel uses. */
export function valueTrace(root: Value): Trace {
  const ordered = root.topologicalOrder();
  const index = new Map(ordered.map((node, i) => [node, i]));
  const nodes: TraceNode[] = ordered.map((node, i) => ({
    id: i,
    label: node.label || (node.op === "input" || node.op === "const" ? round3(node.data) : node.op),
    op: node.op,
    value: node.data,
    grad: node.grad,
    inputs: node.children.map((child) => index.get(child)),
    depth: 0,
  }));
  for (const node of nodes)
    node.depth = node.inputs.length ? Math.max(...node.inputs.map((i) => nodes[i].depth)) + 1 : 0;
  const grads: Record<string, number> = {};
  for (const node of ordered) if (node.label && node.op === "input") grads[node.label] = node.grad;
  return { nodes, value: root.data, grads };
}

const round3 = (x: number) => String(Number(x.toFixed(3)));

/**
 * Check a composed graph against central differences. The builder is called
 * again per perturbation, so it must construct fresh nodes each time — exactly
 * the discipline a training loop needs.
 */
export function checkValueGradients(
  build: (inputs: Value[]) => Value,
  inputs: number[],
  step = 1e-5,
): { analytic: number[]; numeric: number[]; maxError: number } {
  const leaves = inputs.map((x, i) => new Value(x, `x${i}`));
  build(leaves).backward();
  const analytic = leaves.map((leaf) => leaf.grad);
  const numeric = inputs.map((_, i) => {
    const at = (delta: number) => build(inputs.map((x, j) => new Value(j === i ? x + delta : x))).data;
    return (at(step) - at(-step)) / (2 * step);
  });
  return {
    analytic,
    numeric,
    maxError: Math.max(...analytic.map((g, i) => Math.abs(g - numeric[i]))),
  };
}

/** A neuron: one weight per input, a bias, and an optional nonlinearity. */
export type Activation = "tanh" | "relu" | "linear";

export class Neuron {
  readonly weights: Value[];
  readonly bias = new Value(0, "b");
  readonly activation: Activation;
  constructor(inputs: number, random: () => number, activation: Activation = "tanh") {
    this.weights = Array.from({ length: inputs }, (_, i) => new Value(gaussian(random) * 0.8, `w${i}`));
    this.activation = activation;
  }
  forward(inputs: (Value | number)[]): Value {
    const sum = this.weights.reduce<Value>((total, weight, i) => total.add(weight.mul(inputs[i])), this.bias);
    return this.activation === "tanh" ? sum.tanh() : this.activation === "relu" ? sum.relu() : sum;
  }
  parameters(): Value[] {
    return [...this.weights, this.bias];
  }
}

export class Layer {
  readonly neurons: Neuron[];
  constructor(inputs: number, outputs: number, random: () => number, activation: Activation = "tanh") {
    this.neurons = Array.from({ length: outputs }, () => new Neuron(inputs, random, activation));
  }
  forward(inputs: (Value | number)[]): Value[] {
    return this.neurons.map((neuron) => neuron.forward(inputs));
  }
  parameters(): Value[] {
    return this.neurons.flatMap((neuron) => neuron.parameters());
  }
}

/**
 * A stack of layers with a linear output, the smallest network worth training
 * by hand. `sizes` is [inputs, hidden…, outputs].
 */
export class Network {
  readonly layers: Layer[];
  constructor(sizes: number[], seed = 1) {
    const random = rng(seed);
    this.layers = sizes.slice(1).map((outputs, i) =>
      new Layer(sizes[i], outputs, random, i === sizes.length - 2 ? "linear" : "tanh"),
    );
  }
  forward(inputs: (Value | number)[]): Value[] {
    return this.layers.reduce<(Value | number)[]>((activations, layer) => layer.forward(activations), inputs) as Value[];
  }
  parameters(): Value[] {
    return this.layers.flatMap((layer) => layer.parameters());
  }
}

export interface FitResult {
  lossHistory: number[];
  finalLoss: number;
  predictions: number[];
  parameters: number;
}

/**
 * Mean squared error training by plain gradient descent, with the gradients
 * cleared every step. Remove the zeroGrad call and watch the loss diverge: that
 * is the exercise this function exists for.
 */
export function fitNetwork(
  network: Network,
  examples: { inputs: number[]; target: number }[],
  options: { steps?: number; learningRate?: number; clearGradients?: boolean } = {},
): FitResult {
  const steps = options.steps ?? 100;
  const learningRate = options.learningRate ?? 0.05;
  const clearGradients = options.clearGradients ?? true;
  const parameters = network.parameters();
  const lossHistory: number[] = [];
  let predictions: number[] = [];
  for (let step = 0; step < steps; step++) {
    const outputs = examples.map((example) => network.forward(example.inputs)[0]);
    const loss = sumValues(outputs.map((out, i) => out.sub(examples[i].target).pow(2))).div(examples.length);
    if (clearGradients) for (const parameter of parameters) parameter.grad = 0;
    loss.backward();
    for (const parameter of parameters) parameter.data -= learningRate * parameter.grad;
    lossHistory.push(loss.data);
    predictions = outputs.map((out) => out.data);
  }
  return { lossHistory, finalLoss: lossHistory[lossHistory.length - 1], predictions, parameters: parameters.length };
}

// ---------------------------------------------------------------------------
// Lecture 2 — counting bigrams is already a language model
// ---------------------------------------------------------------------------

export interface BigramModel {
  characters: string[];
  counts: number[][];
  probabilities: number[][];
  smoothing: number;
  loss: number;
}

export const BOUNDARY = ".";

export function vocabularyOf(words: string[]): string[] {
  const letters = new Set<string>();
  for (const word of words) for (const character of word) letters.add(character);
  return [BOUNDARY, ...[...letters].sort()];
}

export function trainBigram(words: string[], smoothing = 1): BigramModel {
  const characters = vocabularyOf(words);
  const index = new Map(characters.map((c, i) => [c, i]));
  const counts = characters.map(() => characters.map(() => 0));
  for (const word of words) {
    const padded = BOUNDARY + word + BOUNDARY;
    for (let i = 0; i + 1 < padded.length; i++) counts[index.get(padded[i])][index.get(padded[i + 1])]++;
  }
  const probabilities = counts.map((row) => {
    const total = row.reduce((a, b) => a + b, 0) + smoothing * row.length;
    return row.map((c) => (c + smoothing) / total);
  });
  const model = { characters, counts, probabilities, smoothing, loss: 0 };
  model.loss = bigramLoss(model, words);
  return model;
}

/** Mean negative log likelihood per bigram: the number training must beat. */
export function bigramLoss(model: BigramModel, words: string[]): number {
  const index = new Map(model.characters.map((c, i) => [c, i]));
  let total = 0;
  let count = 0;
  for (const word of words) {
    const padded = BOUNDARY + word + BOUNDARY;
    for (let i = 0; i + 1 < padded.length; i++) {
      const from = index.get(padded[i]);
      const to = index.get(padded[i + 1]);
      if (from === undefined || to === undefined) continue;
      total -= Math.log(model.probabilities[from][to]);
      count++;
    }
  }
  return count ? total / count : 0;
}

export function sampleBigram(model: BigramModel, random: () => number, maxLength = 14): string {
  let current = 0;
  let word = "";
  for (let step = 0; step < maxLength; step++) {
    const row = model.probabilities[current];
    let draw = random();
    let next = row.length - 1;
    for (let i = 0; i < row.length; i++) {
      draw -= row[i];
      if (draw <= 0) {
        next = i;
        break;
      }
    }
    if (next === 0) break;
    word += model.characters[next];
    current = next;
  }
  return word;
}

/** Uniform baseline loss: log(vocabulary size), the "learned nothing" line. */
export function uniformLoss(vocabularySize: number): number {
  return Math.log(vocabularySize);
}

// ---------------------------------------------------------------------------
// Lecture 3 — an embedding-table MLP trained in the browser
// ---------------------------------------------------------------------------

export interface MLPOptions {
  words: string[];
  context?: number;
  embedding?: number;
  hidden?: number;
  steps?: number;
  batch?: number;
  learningRate?: number;
  seed?: number;
  gain?: number;
}

export interface MLPRun {
  characters: string[];
  parameters: number;
  lossHistory: number[];
  trainLoss: number;
  heldOutLoss: number;
  embeddings: number[][];
  samples: string[];
  context: number;
  steps: number;
}

interface Dataset {
  contexts: number[][];
  targets: number[];
}

export function contextDataset(words: string[], characters: string[], context: number): Dataset {
  const index = new Map(characters.map((c, i) => [c, i]));
  const contexts: number[][] = [];
  const targets: number[] = [];
  for (const word of words) {
    let window = new Array(context).fill(0);
    for (const character of word + BOUNDARY) {
      contexts.push([...window]);
      targets.push(index.get(character));
      window = [...window.slice(1), index.get(character)];
    }
  }
  return { contexts, targets };
}

/**
 * A character MLP: context characters are looked up in an embedding table,
 * concatenated, passed through one tanh layer, then projected to vocabulary
 * logits and trained with mean cross-entropy. Small enough for a browser and
 * complete enough to show embeddings organising themselves.
 */
export function trainCharMLP(options: MLPOptions): MLPRun {
  const context = options.context ?? 3;
  const embedding = options.embedding ?? 2;
  const hidden = options.hidden ?? 24;
  const steps = options.steps ?? 400;
  const batch = options.batch ?? 16;
  const learningRate = options.learningRate ?? 0.4;
  const gain = options.gain ?? 1;
  const random = rng(options.seed ?? 1);
  const characters = vocabularyOf(options.words);
  const vocab = characters.length;
  const split = Math.max(1, Math.floor(options.words.length * 0.9));
  const train = contextDataset(options.words.slice(0, split), characters, context);
  const heldOut = contextDataset(options.words.slice(split), characters, context);

  const table = Array.from({ length: vocab }, () => Array.from({ length: embedding }, () => gaussian(random) * 0.5));
  const inputWidth = context * embedding;
  const w1 = Array.from({ length: inputWidth }, () =>
    Array.from({ length: hidden }, () => (gaussian(random) * gain) / Math.sqrt(inputWidth)),
  );
  const b1 = new Array(hidden).fill(0);
  const w2 = Array.from({ length: hidden }, () =>
    Array.from({ length: vocab }, () => (gaussian(random) * gain) / Math.sqrt(hidden)),
  );
  const b2 = new Array(vocab).fill(0);

  function forward(rows: number[][]): { activations: number[][]; probabilities: number[][]; inputs: number[][] } {
    const inputs = rows.map((row) => row.flatMap((id) => table[id]));
    const activations = inputs.map((x) => {
      const h = new Array(hidden).fill(0);
      for (let j = 0; j < hidden; j++) {
        let sum = b1[j];
        for (let i = 0; i < inputWidth; i++) sum += x[i] * w1[i][j];
        h[j] = Math.tanh(sum);
      }
      return h;
    });
    const probabilities = activations.map((h) => {
      const logits = new Array(vocab).fill(0);
      for (let k = 0; k < vocab; k++) {
        let sum = b2[k];
        for (let j = 0; j < hidden; j++) sum += h[j] * w2[j][k];
        logits[k] = sum;
      }
      return softmaxRow(logits);
    });
    return { activations, probabilities, inputs };
  }

  function meanLoss(data: Dataset): number {
    if (!data.targets.length) return 0;
    const { probabilities } = forward(data.contexts);
    let total = 0;
    for (let n = 0; n < data.targets.length; n++) total -= Math.log(Math.max(probabilities[n][data.targets[n]], 1e-12));
    return total / data.targets.length;
  }

  const lossHistory: number[] = [];
  for (let step = 0; step < steps; step++) {
    const rows: number[][] = [];
    const targets: number[] = [];
    const picks: number[] = [];
    for (let b = 0; b < batch; b++) {
      const pick = Math.floor(random() * train.targets.length);
      picks.push(pick);
      rows.push(train.contexts[pick]);
      targets.push(train.targets[pick]);
    }
    const { activations, probabilities, inputs } = forward(rows);
    let batchLoss = 0;
    // Gradients accumulate over the batch and are scaled by 1/batch once,
    // matching the mean loss that is reported.
    const gradW2 = w2.map((row) => row.map(() => 0));
    const gradB2 = new Array(vocab).fill(0);
    const gradW1 = w1.map((row) => row.map(() => 0));
    const gradB1 = new Array(hidden).fill(0);
    const gradTable = table.map((row) => row.map(() => 0));
    for (let n = 0; n < batch; n++) {
      batchLoss -= Math.log(Math.max(probabilities[n][targets[n]], 1e-12));
      const dLogits = probabilities[n].map((p, k) => (p - (k === targets[n] ? 1 : 0)) / batch);
      const dHidden = new Array(hidden).fill(0);
      for (let j = 0; j < hidden; j++) {
        for (let k = 0; k < vocab; k++) {
          gradW2[j][k] += activations[n][j] * dLogits[k];
          dHidden[j] += w2[j][k] * dLogits[k];
        }
      }
      for (let k = 0; k < vocab; k++) gradB2[k] += dLogits[k];
      const dPre = dHidden.map((g, j) => g * (1 - activations[n][j] * activations[n][j]));
      const dInput = new Array(inputWidth).fill(0);
      for (let i = 0; i < inputWidth; i++) {
        for (let j = 0; j < hidden; j++) {
          gradW1[i][j] += inputs[n][i] * dPre[j];
          dInput[i] += w1[i][j] * dPre[j];
        }
      }
      for (let j = 0; j < hidden; j++) gradB1[j] += dPre[j];
      rows[n].forEach((id, slot) => {
        for (let e = 0; e < embedding; e++) gradTable[id][e] += dInput[slot * embedding + e];
      });
    }
    lossHistory.push(batchLoss / batch);
    for (let j = 0; j < hidden; j++) {
      b1[j] -= learningRate * gradB1[j];
      for (let k = 0; k < vocab; k++) w2[j][k] -= learningRate * gradW2[j][k];
    }
    for (let k = 0; k < vocab; k++) b2[k] -= learningRate * gradB2[k];
    for (let i = 0; i < inputWidth; i++)
      for (let j = 0; j < hidden; j++) w1[i][j] -= learningRate * gradW1[i][j];
    for (let v = 0; v < vocab; v++)
      for (let e = 0; e < embedding; e++) table[v][e] -= learningRate * gradTable[v][e];
  }

  const samples: string[] = [];
  for (let s = 0; s < 6; s++) {
    let window = new Array(context).fill(0);
    let word = "";
    for (let length = 0; length < 12; length++) {
      const { probabilities } = forward([window]);
      let draw = random();
      let next = vocab - 1;
      for (let k = 0; k < vocab; k++) {
        draw -= probabilities[0][k];
        if (draw <= 0) {
          next = k;
          break;
        }
      }
      if (next === 0) break;
      word += characters[next];
      window = [...window.slice(1), next];
    }
    samples.push(word);
  }

  return {
    characters,
    parameters: vocab * embedding + inputWidth * hidden + hidden + hidden * vocab + vocab,
    lossHistory,
    trainLoss: meanLoss(train),
    heldOutLoss: meanLoss(heldOut),
    embeddings: table.map((row) => row.slice(0, 2)),
    samples,
    context,
    steps,
  };
}

// ---------------------------------------------------------------------------
// Lecture 4 — activation and gradient statistics of a deep tanh stack
// ---------------------------------------------------------------------------

export interface LayerDiagnostics {
  layer: number;
  activationStd: number;
  saturatedFraction: number;
  gradientStd: number;
  histogram: number[];
}

export interface InitialisationReport {
  layers: LayerDiagnostics[];
  gain: number;
  normalised: boolean;
  deadOutputFraction: number;
}

/**
 * Forward a batch through `depth` tanh layers initialised as
 * gaussian * gain / sqrt(fan-in), then push a unit gradient back. Saturation
 * and vanishing gradients become visible before any training happens.
 */
export function initialisationDiagnostics(options: {
  depth?: number;
  width?: number;
  batch?: number;
  gain?: number;
  normalised?: boolean;
  seed?: number;
  bins?: number;
}): InitialisationReport {
  const depth = options.depth ?? 5;
  const width = options.width ?? 32;
  const batch = options.batch ?? 64;
  const gain = options.gain ?? 1;
  const normalised = options.normalised ?? false;
  const bins = options.bins ?? 17;
  const random = rng(options.seed ?? 3);
  const weights = Array.from({ length: depth }, () =>
    Array.from({ length: width }, () => Array.from({ length: width }, () => (gaussian(random) * gain) / Math.sqrt(width))),
  );
  let activations = Array.from({ length: batch }, () => Array.from({ length: width }, () => gaussian(random)));
  const forwardActivations: number[][][] = [];
  const preActivations: number[][][] = [];
  for (let l = 0; l < depth; l++) {
    let pre = activations.map((row) => {
      const out = new Array(width).fill(0);
      for (let j = 0; j < width; j++) {
        let sum = 0;
        for (let i = 0; i < width; i++) sum += row[i] * weights[l][i][j];
        out[j] = sum;
      }
      return out;
    });
    if (normalised) {
      // Batch normalisation over the batch dimension, gain 1 and shift 0.
      for (let j = 0; j < width; j++) {
        const column = pre.map((row) => row[j]);
        const mean = column.reduce((a, b) => a + b, 0) / batch;
        const variance = column.reduce((a, b) => a + (b - mean) ** 2, 0) / batch;
        const scale = 1 / Math.sqrt(variance + 1e-5);
        for (const row of pre) row[j] = (row[j] - mean) * scale;
      }
    }
    preActivations.push(pre);
    activations = pre.map((row) => row.map(Math.tanh));
    forwardActivations.push(activations);
  }
  // Backward pass with a unit upstream gradient per output unit.
  let gradient = activations.map((row) => row.map(() => 1 / Math.sqrt(width)));
  const gradientStds: number[] = [];
  for (let l = depth - 1; l >= 0; l--) {
    const dPre = gradient.map((row, n) => row.map((g, j) => g * (1 - forwardActivations[l][n][j] ** 2)));
    const flat = dPre.flat();
    gradientStds[l] = Math.sqrt(flat.reduce((a, b) => a + b * b, 0) / flat.length);
    gradient = dPre.map((row) => {
      const out = new Array(width).fill(0);
      for (let i = 0; i < width; i++) {
        let sum = 0;
        for (let j = 0; j < width; j++) sum += row[j] * weights[l][i][j];
        out[i] = sum;
      }
      return out;
    });
  }
  const layers = forwardActivations.map((layerActivations, l) => {
    const flat = layerActivations.flat();
    const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
    const histogram = new Array(bins).fill(0);
    for (const value of flat) {
      const bin = Math.min(bins - 1, Math.max(0, Math.floor(((value + 1) / 2) * bins)));
      histogram[bin]++;
    }
    return {
      layer: l + 1,
      activationStd: Math.sqrt(flat.reduce((a, b) => a + (b - mean) ** 2, 0) / flat.length),
      saturatedFraction: flat.filter((v) => Math.abs(v) > 0.97).length / flat.length,
      gradientStd: gradientStds[l],
      histogram: histogram.map((count) => count / flat.length),
    };
  });
  const last = forwardActivations[depth - 1];
  const deadOutputFraction =
    Array.from({ length: width }, (_, j) => last.every((row) => Math.abs(row[j]) > 0.97)).filter(Boolean).length / width;
  return { layers, gain, normalised, deadOutputFraction };
}

// ---------------------------------------------------------------------------
// Lecture 5 — manual backpropagation, checked against finite differences
// ---------------------------------------------------------------------------

export type GradientRule = "correct" | "no-batch-mean" | "no-onehot" | "transposed-hidden";

export interface GradientCheck {
  rule: GradientRule;
  entries: { name: string; maxError: number; passed: boolean }[];
  passed: boolean;
  explanation: string;
}

const RULE_NOTES: Record<GradientRule, string> = {
  correct: "Every tensor matches the finite-difference reference to roughly 1e-7.",
  "no-batch-mean": "Dropping the 1/batch factor scales every gradient by the batch size; the loss still falls, so only a check catches it.",
  "no-onehot": "Without subtracting the one-hot target, the logit gradient pushes all classes down and never up.",
  "transposed-hidden": "Using the forward weight orientation on the way back corrupts the earlier layers while the last layer still checks out.",
};

/**
 * A two-layer tanh network with softmax cross-entropy, differentiated by hand
 * under a chosen rule, then compared with central differences. The deliberately
 * wrong rules reproduce the mistakes that survive training and fail a check.
 */
export function gradientCheck(rule: GradientRule = "correct", seed = 7, tolerance = 1e-5): GradientCheck {
  const random = rng(seed);
  const batch = 4;
  const inputs = 3;
  const hidden = 4;
  const classes = 3;
  const x = Array.from({ length: batch }, () => Array.from({ length: inputs }, () => gaussian(random)));
  const labels = Array.from({ length: batch }, () => Math.floor(random() * classes));
  const w1 = Array.from({ length: inputs }, () => Array.from({ length: hidden }, () => gaussian(random) * 0.6));
  const b1 = Array.from({ length: hidden }, () => gaussian(random) * 0.1);
  const w2 = Array.from({ length: hidden }, () => Array.from({ length: classes }, () => gaussian(random) * 0.6));
  const b2 = Array.from({ length: classes }, () => gaussian(random) * 0.1);

  const forward = () => {
    const h = x.map((row) => {
      const out = new Array(hidden).fill(0);
      for (let j = 0; j < hidden; j++) {
        let sum = b1[j];
        for (let i = 0; i < inputs; i++) sum += row[i] * w1[i][j];
        out[j] = Math.tanh(sum);
      }
      return out;
    });
    const probabilities = h.map((row) => {
      const logits = new Array(classes).fill(0);
      for (let k = 0; k < classes; k++) {
        let sum = b2[k];
        for (let j = 0; j < hidden; j++) sum += row[j] * w2[j][k];
        logits[k] = sum;
      }
      return softmaxRow(logits);
    });
    const loss =
      probabilities.reduce((total, row, n) => total - Math.log(Math.max(row[labels[n]], 1e-12)), 0) / batch;
    return { h, probabilities, loss };
  };

  const { h, probabilities } = forward();
  const scale = rule === "no-batch-mean" ? 1 : 1 / batch;
  const gradW1 = w1.map((row) => row.map(() => 0));
  const gradB1 = new Array(hidden).fill(0);
  const gradW2 = w2.map((row) => row.map(() => 0));
  const gradB2 = new Array(classes).fill(0);
  for (let n = 0; n < batch; n++) {
    const dLogits = probabilities[n].map((p, k) =>
      rule === "no-onehot" ? p * scale : (p - (k === labels[n] ? 1 : 0)) * scale,
    );
    const dHidden = new Array(hidden).fill(0);
    for (let j = 0; j < hidden; j++)
      for (let k = 0; k < classes; k++) {
        gradW2[j][k] += h[n][j] * dLogits[k];
        // The transposed rule indexes the forward orientation on the backward
        // path, a mistake that only shows up in the earlier layer.
        dHidden[j] += (rule === "transposed-hidden" ? w2[(k * hidden + j) % hidden][j % classes] : w2[j][k]) * dLogits[k];
      }
    for (let k = 0; k < classes; k++) gradB2[k] += dLogits[k];
    const dPre = dHidden.map((g, j) => g * (1 - h[n][j] ** 2));
    for (let i = 0; i < inputs; i++)
      for (let j = 0; j < hidden; j++) gradW1[i][j] += x[n][i] * dPre[j];
    for (let j = 0; j < hidden; j++) gradB1[j] += dPre[j];
  }

  const numeric = (set: (delta: number) => void) => {
    const step = 1e-5;
    set(step);
    const high = forward().loss;
    set(-2 * step);
    const low = forward().loss;
    set(step);
    return (high - low) / (2 * step);
  };
  const compare = (
    name: string,
    analytic: number[][] | number[],
    write: (i: number, j: number, delta: number) => void,
    rows: number,
    columns: number,
  ) => {
    let maxError = 0;
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < columns; j++) {
        const reference = numeric((delta) => write(i, j, delta));
        const value = Array.isArray(analytic[i]) ? (analytic as number[][])[i][j] : (analytic as number[])[j];
        maxError = Math.max(maxError, Math.abs(value - reference));
      }
    return { name, maxError, passed: maxError < tolerance };
  };

  const entries = [
    compare("W1", gradW1, (i, j, d) => {
      w1[i][j] += d;
    }, inputs, hidden),
    compare("b1", gradB1, (_i, j, d) => {
      b1[j] += d;
    }, 1, hidden),
    compare("W2", gradW2, (i, j, d) => {
      w2[i][j] += d;
    }, hidden, classes),
    compare("b2", gradB2, (_i, j, d) => {
      b2[j] += d;
    }, 1, classes),
  ];
  return { rule, entries, passed: entries.every((e) => e.passed), explanation: RULE_NOTES[rule] };
}

// ---------------------------------------------------------------------------
// Lecture 6 — hierarchical context instead of one flat concatenation
// ---------------------------------------------------------------------------

export interface ContextPlan {
  depth: number;
  fanIn: number;
  contextLength: number;
  groupsPerLayer: number[];
  flatParameters: number;
  hierarchicalParameters: number;
  /** How both designs grow as the context doubles, including the crossover. */
  scaling: { depth: number; contextLength: number; flat: number; hierarchical: number }[];
}

/**
 * A tree of fan-in `fanIn` repeated `depth` times sees fanIn^depth positions.
 * The comparison shows why widening the context by concatenating everything
 * into one layer becomes the expensive option.
 */
export function contextPlan(options: {
  depth?: number;
  fanIn?: number;
  embedding?: number;
  hidden?: number;
}): ContextPlan {
  const depth = options.depth ?? 3;
  const fanIn = options.fanIn ?? 2;
  const embedding = options.embedding ?? 16;
  const hidden = options.hidden ?? 64;
  const contextLength = fanIn ** depth;
  const groupsPerLayer = Array.from({ length: depth }, (_, l) => contextLength / fanIn ** (l + 1));
  // One wide layer pays for every context position at once; a tree pays per
  // level, so the two curves cross at a context length worth locating.
  const flat = (positions: number) => positions * embedding * hidden + hidden;
  const hierarchical = (levels: number) =>
    fanIn * embedding * hidden + hidden + (levels - 1) * (fanIn * hidden * hidden + hidden);
  return {
    depth,
    fanIn,
    contextLength,
    groupsPerLayer,
    flatParameters: flat(contextLength),
    hierarchicalParameters: hierarchical(depth),
    scaling: Array.from({ length: 8 }, (_, i) => ({
      depth: i + 1,
      contextLength: fanIn ** (i + 1),
      flat: flat(fanIn ** (i + 1)),
      hierarchical: hierarchical(i + 1),
    })),
  };
}

// ---------------------------------------------------------------------------
// Lecture 7 — one causal self-attention head, computed not illustrated
// ---------------------------------------------------------------------------

export interface AttentionResult {
  tokens: string[];
  weights: number[][];
  rowSums: number[];
  outputs: number[][];
  causal: boolean;
  earlierPositionDrift: number;
}

function tokenEmbedding(token: string, position: number, width: number, random: () => number): number[] {
  // Content depends on the token text, position on the index: changing a token
  // changes its row only, which is what the invariance check relies on.
  const content = rng([...token].reduce((a, c) => a + c.charCodeAt(0), 17));
  return Array.from({ length: width }, () => gaussian(content) * 0.8 + Math.sin(position + 1) * 0.3 + gaussian(random) * 0.05);
}

export function selfAttention(options: {
  tokens: string[];
  headDim?: number;
  causal?: boolean;
  temperature?: number;
  seed?: number;
}): AttentionResult {
  const tokens = options.tokens;
  const headDim = options.headDim ?? 8;
  const causal = options.causal ?? true;
  const temperature = options.temperature ?? 1;
  const seed = options.seed ?? 11;
  const run = (sequence: string[]) => {
    const random = rng(seed);
    const embeddings = sequence.map((token, i) => tokenEmbedding(token, i, headDim, random));
    const projection = () =>
      Array.from({ length: headDim }, () => Array.from({ length: headDim }, () => gaussian(random) / Math.sqrt(headDim)));
    const wq = projection();
    const wk = projection();
    const wv = projection();
    const project = (matrix: number[][]) =>
      embeddings.map((row) =>
        Array.from({ length: headDim }, (_, j) => row.reduce((sum, value, i) => sum + value * matrix[i][j], 0)),
      );
    const q = project(wq);
    const k = project(wk);
    const v = project(wv);
    const weights = q.map((query, i) => {
      const scores = k.map((key, j) =>
        causal && j > i
          ? -Infinity
          : query.reduce((sum, value, d) => sum + value * key[d], 0) / (Math.sqrt(headDim) * temperature),
      );
      return softmaxRow(scores.map((s) => (s === -Infinity ? -1e9 : s)));
    });
    const outputs = weights.map((row) =>
      Array.from({ length: headDim }, (_, d) => row.reduce((sum, weight, j) => sum + weight * v[j][d], 0)),
    );
    return { weights, outputs };
  };
  const { weights, outputs } = run(tokens);
  // Replace the final token and measure how much earlier outputs moved. Causal
  // attention must report zero; remove the mask and it will not.
  const altered = [...tokens.slice(0, -1), tokens[tokens.length - 1] + "?"];
  const shifted = run(altered);
  let earlierPositionDrift = 0;
  for (let i = 0; i < tokens.length - 1; i++)
    for (let d = 0; d < headDim; d++)
      earlierPositionDrift = Math.max(earlierPositionDrift, Math.abs(outputs[i][d] - shifted.outputs[i][d]));
  return {
    tokens,
    weights,
    rowSums: weights.map((row) => row.reduce((a, b) => a + b, 0)),
    outputs,
    causal,
    earlierPositionDrift,
  };
}

// ---------------------------------------------------------------------------
// Lecture 8 — byte-level byte-pair encoding
// ---------------------------------------------------------------------------

export interface Merge {
  id: number;
  pair: [number, number];
  count: number;
  piece: string;
}

export interface BPEModel {
  merges: Merge[];
  vocabularySize: number;
  ids: number[];
  bytes: number;
  compression: number;
}

const bytesOf = (text: string) => [...new TextEncoder().encode(text)];

function mergePass(ids: number[], pair: [number, number], replacement: number): number[] {
  const output: number[] = [];
  for (let i = 0; i < ids.length; ) {
    if (i + 1 < ids.length && ids[i] === pair[0] && ids[i + 1] === pair[1]) {
      output.push(replacement);
      i += 2;
    } else output.push(ids[i++]);
  }
  return output;
}

/** Repeatedly merge the most frequent adjacent pair, exactly as BPE prescribes. */
export function trainBPE(text: string, mergeCount = 20): BPEModel {
  let ids = bytesOf(text);
  const bytes = ids.length;
  const merges: Merge[] = [];
  const pieces = new Map<number, string>();
  const pieceOf = (id: number): string =>
    id < 256 ? new TextDecoder().decode(new Uint8Array([id])) : pieces.get(id) ?? `<${id}>`;
  for (let step = 0; step < mergeCount; step++) {
    const counts = new Map<string, number>();
    for (let i = 0; i + 1 < ids.length; i++) {
      const key = `${ids[i]},${ids[i + 1]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    let best = "";
    let bestCount = 1;
    for (const [key, count] of counts) if (count > bestCount) [best, bestCount] = [key, count];
    if (!best) break;
    const pair = best.split(",").map(Number) as [number, number];
    const id = 256 + merges.length;
    pieces.set(id, pieceOf(pair[0]) + pieceOf(pair[1]));
    merges.push({ id, pair, count: bestCount, piece: pieces.get(id) });
    ids = mergePass(ids, pair, id);
  }
  return {
    merges,
    vocabularySize: 256 + merges.length,
    ids,
    bytes,
    compression: ids.length ? bytes / ids.length : 1,
  };
}

export function encodeBPE(model: BPEModel, text: string): number[] {
  let ids = bytesOf(text);
  for (const merge of model.merges) ids = mergePass(ids, merge.pair, merge.id);
  return ids;
}

export function decodeBPE(model: BPEModel, ids: number[]): string {
  const expand = (id: number): number[] => {
    if (id < 256) return [id];
    const merge = model.merges.find((m) => m.id === id);
    return merge ? [...expand(merge.pair[0]), ...expand(merge.pair[1])] : [];
  };
  return new TextDecoder().decode(new Uint8Array(ids.flatMap(expand)));
}

/** Token strings for display: what the model actually sees, whitespace included. */
export function tokenPieces(model: BPEModel, ids: number[]): string[] {
  return ids.map((id) => decodeBPE(model, [id]));
}

// ---------------------------------------------------------------------------
// Lecture 9 — parameter, compute, and schedule arithmetic before renting a GPU
// ---------------------------------------------------------------------------

export interface ParameterBreakdown {
  embedding: number;
  positional: number;
  attention: number;
  feedForward: number;
  total: number;
}

/** Parameter count of a GPT-2 style decoder with tied input/output embeddings. */
export function parameterCount(options: {
  layers?: number;
  width?: number;
  vocabulary?: number;
  context?: number;
  expansion?: number;
}): ParameterBreakdown {
  const layers = options.layers ?? 12;
  const width = options.width ?? 768;
  const vocabulary = options.vocabulary ?? 50257;
  const context = options.context ?? 1024;
  const expansion = options.expansion ?? 4;
  const attention = layers * (4 * width * width + 4 * width);
  const feedForward = layers * (2 * expansion * width * width + expansion * width + width);
  const norms = layers * 4 * width + 2 * width;
  return {
    embedding: vocabulary * width,
    positional: context * width,
    attention,
    feedForward,
    total: vocabulary * width + context * width + attention + feedForward + norms,
  };
}

export interface Budget {
  flops: number;
  hours: number;
  dollars: number;
  tokensPerParameter: number;
  chinchillaOptimalTokens: number;
}

/**
 * Training compute is estimated as 6 · parameters · tokens (forward plus
 * backward), the standard approximation from the scaling-law literature — an
 * estimate for planning, not a measured runtime. Achieved throughput is the
 * device peak multiplied by model FLOPs utilisation.
 */
export function trainingBudget(options: {
  parameters: number;
  tokens: number;
  deviceTflops?: number;
  utilisation?: number;
  dollarsPerHour?: number;
}): Budget {
  const deviceTflops = options.deviceTflops ?? 100;
  const utilisation = options.utilisation ?? 0.4;
  const dollarsPerHour = options.dollarsPerHour ?? 2;
  const flops = 6 * options.parameters * options.tokens;
  const hours = flops / (deviceTflops * 1e12 * utilisation) / 3600;
  return {
    flops,
    hours,
    dollars: hours * dollarsPerHour,
    tokensPerParameter: options.tokens / options.parameters,
    chinchillaOptimalTokens: 20 * options.parameters,
  };
}

/** Linear warmup then cosine decay, the schedule used by GPT-2 reproductions. */
export function learningRateSchedule(options: {
  steps?: number;
  warmup?: number;
  peak?: number;
  floorFraction?: number;
}): number[] {
  const steps = options.steps ?? 100;
  const warmup = Math.min(options.warmup ?? 10, steps);
  const peak = options.peak ?? 6e-4;
  const floor = peak * (options.floorFraction ?? 0.1);
  return Array.from({ length: steps }, (_, step) => {
    if (step < warmup) return (peak * (step + 1)) / warmup;
    const progress = (step - warmup) / Math.max(1, steps - warmup);
    return floor + 0.5 * (peak - floor) * (1 + Math.cos(Math.PI * progress));
  });
}
