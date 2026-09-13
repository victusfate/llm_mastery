// Part of the Zero to Hero numerics. Every routine is an original implementation
// written for this course, deterministic under a seed so a number in a lesson
// can be asserted in a test. Import from ./z2h-numerics.ts, which re-exports the
// whole set as one API.

import { gaussian, rng } from "./z2h-random.ts";
import type { Trace, TraceNode } from "./z2h-autograd-expression.ts";

// Lecture 1, second form — the same autograd as an object you compose

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
    label: node.label || (node.op === "input" || node.op === "const" ? "" : node.op),
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
