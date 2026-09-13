// Part of the Zero to Hero numerics. Every routine is an original implementation
// written for this course, deterministic under a seed so a number in a lesson
// can be asserted in a test. Import from ./z2h-numerics.ts, which re-exports the
// whole set as one API.

// Lecture 1 — scalar reverse-mode autograd over a typed expression

export type Expression =
  | { kind: "number"; value: number }
  | { kind: "variable"; name: string }
  | { kind: "binary"; op: "+" | "-" | "*" | "/" | "^"; left: Expression; right: Expression }
  | { kind: "call"; fn: string; argument: Expression };

const UNARY_FUNCTIONS: Record<string, (x: number) => [number, number]> = {
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
