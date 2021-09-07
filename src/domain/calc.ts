// Common
export type NumericLiteral = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0;

export type Term = "*" | "/";
export type BinaryOp = "+" | "-" | Term;
export type Op = BinaryOp | "C" | "AC" | "+/-" | "%" | "." | "=";

export const isTerm = (op: BinaryOp): op is Term => op === "*" || op === "/";

// Number
export type WrapNumber = { minus: boolean; positive: number };

export const num = (n: NumericLiteral): WrapNumber => ({ minus: false, positive: n });

export const zero = (): WrapNumber => num(0);

export const toNum = (number: WrapNumber): number =>
  number.minus ? -number.positive : number.positive;

const fromNum = (num: number): WrapNumber => ({
  minus: num < 0,
  positive: Math.abs(num),
});

export const apply = (op: BinaryOp, l: WrapNumber, r: WrapNumber): WrapNumber => {
  const dl = toNum(l);
  const dr = toNum(r);
  switch (op) {
    case "+":
      return fromNum(dl + dr);
    case "-":
      return fromNum(dl - dr);
    case "*":
      return fromNum(dl * dr);
    case "/":
      return fromNum(dl / dr);
  }
};

// State
export enum State {
  initial = "initial",
  num_entered = "num_entered",
  op_entered = "op_entered",
  evaluated = "evaluated",
}

// Stack
export type StackNumElement = { type: "num"; n: WrapNumber };
export type StackOpElement = { type: "op"; op: BinaryOp };
export type StackElement = StackNumElement | StackOpElement;
export type Stack = Array<StackElement>;

const evalTerm = (stack: Stack): WrapNumber => {
  const top = stack.pop();
  if (top === undefined) {
    return zero();
  } else if (top.type === "op") {
    stack.push(top);
    return zero();
  }

  let acc = top.n;
  while (true) {
    const op = stack.pop();
    if (op === undefined) {
      break;
    } else if (op.type === "op" && isTerm(op.op)) {
      const r = stack.pop();
      if (r === undefined) {
        break;
      } else if (r.type === "num") {
        acc = apply(op.op, acc, r.n);
      } else {
        stack.push(op);
        stack.push(r);
        break;
      }
    } else {
      stack.push(op);
      break;
    }
  }
  return acc;
};

const evalExpr = (stack: Stack): WrapNumber => {
  let acc = evalTerm(stack);
  while (true) {
    const op = stack.pop();
    if (op === undefined) {
      break;
    } else if (op.type === "op" && !isTerm(op.op)) {
      const r = evalTerm(stack);
      acc = apply(op.op, acc, r);
    } else {
      stack.push(op);
      break;
    }
  }
  return acc;
};

export const evalStack = (stack: Stack): WrapNumber => {
  const copiedStack = stack.slice().reverse();
  return evalExpr(copiedStack);
};

export const stackTop = (stack: Stack): StackElement | undefined => stack[stack.length - 1];
export const stack2nd = (stack: Stack): StackElement | undefined => stack[stack.length - 2];

// Model
export class CalculatorModel {
  private state: State = State.initial;

  private current: WrapNumber = zero();
  private _point = 0;
  private input = false;

  private stack: Stack = [];

  private thunk: { op: BinaryOp; r: WrapNumber } | null = null;

  num(n: NumericLiteral): void {
    switch (this.state) {
      case State.initial:
      case State.op_entered:
        this.current = num(n);
        this.state = State.num_entered;
        break;
      case State.evaluated:
      case State.num_entered:
        if (this.input) {
          if (this._point > 0) {
            this.current.positive += Math.pow(10, -this._point) * n;
            this._point++;
          } else {
            this.current.positive *= 10;
            this.current.positive += n;
          }
        } else {
          this.current = num(n);
        }
        break;
    }

    this.input = true;
  }

  allClear(): void {
    this.current = zero();
    this._point = 0;
    this.input = false;
    this.stack = [];
    this.thunk = null;
    this.state = State.initial;
  }

  clear(): void {
    switch (this.state) {
      case State.initial:
        break;
      case State.op_entered:
      case State.evaluated:
      case State.num_entered:
        this.current = zero();
        this._point = 0;
        this.input = false;
        break;
    }
  }

  eq(): void {
    switch (this.state) {
      case State.initial:
        return;
      case State.evaluated:
        if (this.thunk) {
          this.current = apply(this.thunk.op, this.current, this.thunk.r);
        }
        break;
      case State.num_entered: {
        const top = stackTop(this.stack);
        if (top) {
          this.thunk = { op: (top as StackOpElement).op, r: { ...this.current } };
        }
        this.stack.push({ type: "num", n: { ...this.current } });
        this.current = evalStack(this.stack);
        break;
      }
      case State.op_entered:
        this.thunk = {
          op: (stackTop(this.stack) as StackOpElement).op,
          r: { ...(stack2nd(this.stack) as StackNumElement).n },
        };
        this.stack.push({ type: "num", n: { ...this.current } });
        this.current = evalStack(this.stack);
        break;
    }
    this._point = 0;
    this.input = false;
    this.stack = [];
    this.state = State.evaluated;
  }

  private op(op: BinaryOp): void {
    switch (this.state) {
      case State.initial:
      case State.evaluated:
      case State.num_entered:
        this.stack.push({ type: "num", n: { ...this.current } });
        if (!isTerm(op)) this.current = evalStack(this.stack);
        this.stack.push({ type: "op", op: op });
        this.thunk = null;
        this.state = State.op_entered;
        break;
      case State.op_entered:
        this.stack.pop();
        if (isTerm(op)) {
          const { n } = stackTop(this.stack) as StackNumElement;
          this.current = { ...n };
        } else {
          this.current = evalStack(this.stack);
        }
        this.stack.push({ type: "op", op: op });
        break;
    }
  }

  add(): void {
    this.op("+");
  }

  sub(): void {
    this.op("-");
  }

  mul(): void {
    this.op("*");
  }

  div(): void {
    this.op("/");
  }

  plusMinus(): void {
    switch (this.state) {
      case State.initial:
      case State.op_entered:
        this.current = zero();
        this.current.minus = true;
        this.input = true;
        this.state = State.num_entered;
        break;
      case State.evaluated:
      case State.num_entered:
        this.current.minus = !this.current.minus;
        break;
    }
  }

  percent(): void {
    switch (this.state) {
      case State.initial:
        break;
      case State.evaluated:
        this.current.positive /= 100;
        break;
      case State.op_entered: {
        const { op } = stackTop(this.stack) as StackOpElement;
        if (isTerm(op)) {
          this.current.positive /= 100;
        } else {
          const { n } = stack2nd(this.stack) as StackNumElement;
          const r = { ...this.current };
          r.positive /= 100;
          this.current = apply("*", n, r);
        }
        break;
      }
      case State.num_entered: {
        const top = stackTop(this.stack);
        if (top && top.type === "op" && !isTerm(top.op)) {
          const tmp = this.stack.pop()!;
          const val = evalStack(this.stack);
          this.stack.push(tmp);

          const p = { ...this.current };
          p.positive /= 100;
          this.current = apply("*", val, p);
        } else {
          this.current.positive /= 100;
        }
        break;
      }
    }
    this.input = false;
  }

  point(): void {
    switch (this.state) {
      case State.initial:
      case State.op_entered:
        this.current = zero();
        this._point = 1;
        this.input = true;
        this.state = State.num_entered;
        break;
      case State.evaluated:
      case State.num_entered:
        if (this.input) {
          if (this._point === 0) this._point = 1;
        } else {
          this.current = zero();
          this._point = 1;
          this.input = true;
        }
        break;
    }
  }

  getActiveOp(): BinaryOp | undefined {
    switch (this.state) {
      case State.evaluated:
      case State.initial:
        return;
      case State.op_entered:
        return (stackTop(this.stack) as StackOpElement).op;
      case State.num_entered:
        if (!this.input) {
          const top = stackTop(this.stack);
          if (top) return (top as StackOpElement).op;
        }
        return;
    }
  }

  getInputNumber(): boolean {
    return this.input;
  }

  // other

  getCurrent(): number {
    return toNum(this.current);
  }

  toString(): string {
    return JSON.stringify({
      state: this.state,
      current: this.current,
      point: this._point,
      input: this.input,
      stack: this.stack,
      thunk: this.thunk,
    });
  }
}
