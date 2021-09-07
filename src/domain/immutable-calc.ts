import { produce } from "immer";
import {
  apply,
  BinaryOp,
  evalStack,
  isTerm,
  num,
  NumericLiteral,
  Op,
  Stack,
  stack2nd,
  StackNumElement,
  StackOpElement,
  stackTop,
  State as StateType,
  toNum,
  WrapNumber,
  zero,
} from "./calc";

interface State {
  type: StateType;
  current: WrapNumber;
  point: number;
  input: boolean;
  cleared: boolean;
  stack: Stack;
  thunk?: { op: BinaryOp; r: WrapNumber };
}

export type Action = { type: "lit"; n: NumericLiteral } | { type: "op"; op: Op };

export const initialState: State = {
  type: StateType.initial,
  current: zero(),
  point: 0,
  input: false,
  cleared: false,
  stack: [],
};

export const calculatorReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "lit":
      return handleLit(state, action.n);
    case "op":
      switch (action.op) {
        case "AC":
          return initialState;
        case "C":
          return handleC(state);
        case "+/-":
          return handlePlusMinus(state);
        case "%":
          return handlePercent(state);
        case ".":
          return handlePoint(state);
        case "=":
          return handleEq(state);
        case "+":
        case "-":
        case "*":
        case "/":
          return handleOp(state, action.op);
      }
  }
};

const handleOp = (state: State, op: BinaryOp): State =>
  produce(state, (draft) => {
    switch (draft.type) {
      case StateType.initial:
      case StateType.evaluated:
      case StateType.num_entered:
        draft.stack.push({ type: "num", n: draft.current });
        if (!isTerm(op)) draft.current = evalStack(draft.stack);
        draft.stack.push({ type: "op", op: op });
        draft.thunk = undefined;
        draft.type = StateType.op_entered;
        break;
      case StateType.op_entered:
        draft.stack.pop();
        if (isTerm(op)) {
          const { n } = stackTop(draft.stack) as StackNumElement;
          draft.current = n;
        } else {
          draft.current = evalStack(draft.stack);
        }
        draft.stack.push({ type: "op", op });
        break;
    }
  });

const handleEq = (state: State): State =>
  produce(state, (draft) => {
    switch (draft.type) {
      case StateType.initial:
        return;
      case StateType.evaluated:
        if (draft.thunk) {
          draft.current = apply(draft.thunk.op, draft.current, draft.thunk.r);
        }
        break;
      case StateType.num_entered: {
        const top = stackTop(draft.stack);
        if (top) {
          draft.thunk = { op: (top as StackOpElement).op, r: draft.current };
        }
        draft.stack.push({ type: "num", n: draft.current });
        draft.current = evalStack(draft.stack);
        break;
      }
      case StateType.op_entered:
        draft.thunk = {
          op: (stackTop(draft.stack) as StackOpElement).op,
          r: (stack2nd(draft.stack) as StackNumElement).n,
        };
        draft.stack.push({ type: "num", n: draft.current });
        draft.current = evalStack(draft.stack);
        break;
    }
    draft.point = 0;
    draft.input = false;
    draft.stack = [];
    draft.type = StateType.evaluated;
  });

const handleC = (state: State): State =>
  produce(state, (draft) => {
    switch (draft.type) {
      case StateType.initial:
        break;
      case StateType.op_entered:
      case StateType.evaluated:
      case StateType.num_entered:
        draft.current = zero();
        draft.point = 0;
        draft.input = false;
        draft.cleared = true;
        break;
    }
  });

const handlePlusMinus = (state: State): State =>
  produce(state, (draft) => {
    switch (draft.type) {
      case StateType.initial:
      case StateType.op_entered:
        draft.current = zero();
        draft.current.minus = true;
        draft.input = true;
        draft.type = StateType.num_entered;
        break;
      case StateType.num_entered:
        draft.input = true;
      // eslint-disable-next-line no-fallthrough
      case StateType.evaluated:
        draft.current.minus = !draft.current.minus;
        break;
    }
  });

const handleLit = (state: State, n: NumericLiteral): State =>
  produce(state, (draft) => {
    switch (draft.type) {
      case StateType.initial:
      case StateType.op_entered:
        draft.current = num(n);
        draft.type = StateType.num_entered;
        break;
      case StateType.evaluated:
      case StateType.num_entered:
        if (draft.input) {
          if (draft.point > 0) {
            draft.current.positive += Math.pow(10, -draft.point) * n;
            draft.point++;
          } else {
            draft.current.positive *= 10;
            draft.current.positive += n;
          }
        } else {
          draft.current = num(n);
        }
        break;
    }
    draft.input = true;
    draft.cleared = false;
  });

const handlePercent = (state: State): State =>
  produce(state, (draft) => {
    switch (draft.type) {
      case StateType.initial:
        break;
      case StateType.evaluated:
        draft.current.positive /= 100;
        break;
      case StateType.op_entered: {
        const { op } = stackTop(draft.stack) as StackOpElement;
        if (isTerm(op)) {
          draft.current.positive /= 100;
        } else {
          const { n } = stack2nd(draft.stack) as StackNumElement;
          const r = draft.current;
          r.positive /= 100;
          draft.current = apply("*", n, r);
        }
        break;
      }
      case StateType.num_entered: {
        const top = stackTop(draft.stack);
        if (top && top.type === "op" && !isTerm(top.op)) {
          const tmp = draft.stack.pop()!;
          const val = evalStack(draft.stack);
          draft.stack.push(tmp);

          const p = draft.current;
          p.positive /= 100;
          draft.current = apply("*", val, p);
        } else {
          draft.current.positive /= 100;
        }
        break;
      }
    }
    draft.input = false;
  });

const handlePoint = (state: State): State =>
  produce(state, (draft) => {
    switch (draft.type) {
      case StateType.initial:
      case StateType.op_entered:
        draft.current = zero();
        draft.point = 1;
        draft.type = StateType.num_entered;
        break;
      case StateType.evaluated:
      case StateType.num_entered:
        if (draft.input) {
          if (draft.point === 0) draft.point = 1;
        } else {
          draft.current = zero();
          draft.point = 1;
        }
        break;
    }
    draft.input = true;
    draft.cleared = false;
  });

export const getCurrent = (state: State): number => toNum(state.current);

export const getActiveOp = (state: State): BinaryOp | undefined => {
  switch (state.type) {
    case StateType.op_entered:
      return (stackTop(state.stack) as StackOpElement).op;
    case StateType.num_entered:
      if (state.cleared) {
        const top = stackTop(state.stack);
        if (top) return (top as StackOpElement).op;
      }
  }
};

export const isInputNumber = (state: State): boolean => {
  switch (state.type) {
    case StateType.initial:
      return false;
    case StateType.evaluated:
    case StateType.op_entered:
    case StateType.num_entered:
      return !state.cleared;
  }
};
