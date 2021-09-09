import { Decimal } from "decimal.js";
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

const handleOp = (state: State, op: BinaryOp): State => {
  switch (state.type) {
    case StateType.initial:
    case StateType.evaluated:
    case StateType.num_entered: {
      const stack: Stack = [...state.stack, { type: "num", n: state.current }];
      const current = isTerm(op) ? state.current : evalStack(stack);
      stack.push({ type: "op", op });

      return {
        ...state,
        current,
        stack,
        thunk: undefined,
        type: StateType.op_entered,
      };
    }
    case StateType.op_entered: {
      const popped = state.stack.slice(0, state.stack.length - 1);
      let current;
      if (isTerm(op)) {
        const { n } = stackTop(popped) as StackNumElement;
        current = n;
      } else {
        current = evalStack(state.stack);
      }
      popped.push({ type: "op", op });
      return { ...state, stack: popped, current };
    }
  }
};

const handleEq = (state: State): State => {
  switch (state.type) {
    case StateType.initial:
      return state;
    case StateType.evaluated:
      return {
        ...state,
        current: state.thunk ? apply(state.thunk.op, state.current, state.thunk.r) : state.current,
        point: 0,
        input: false,
        stack: [],
        type: StateType.evaluated,
      };
    case StateType.num_entered: {
      const top = stackTop(state.stack);
      return {
        ...state,
        thunk: top ? { op: (top as StackOpElement).op, r: state.current } : undefined,
        current: evalStack([...state.stack, { type: "num", n: state.current }]),
        point: 0,
        input: false,
        stack: [],
        type: StateType.evaluated,
      };
    }
    case StateType.op_entered:
      return {
        ...state,
        thunk: {
          op: (stackTop(state.stack) as StackOpElement).op,
          r: (stack2nd(state.stack) as StackNumElement).n,
        },
        current: evalStack([...state.stack, { type: "num", n: state.current }]),
        point: 0,
        input: false,
        stack: [],
        type: StateType.evaluated,
      };
  }
};

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
            draft.current.positive = draft.current.positive.add(
              new Decimal(10).pow(-draft.point).mul(n)
            );
            draft.point++;
          } else {
            draft.current.positive = draft.current.positive.mul(10).add(n);
          }
        } else {
          draft.current = num(n);
        }
        break;
    }
    draft.input = true;
    draft.cleared = false;
  });

const handlePercent = (state: State): State => {
  switch (state.type) {
    case StateType.initial:
      return state;
    case StateType.evaluated:
      return {
        ...state,
        current: { ...state.current, positive: state.current.positive.div(100) },
        input: false,
      };
    case StateType.op_entered: {
      const { op } = stackTop(state.stack) as StackOpElement;
      let current;
      if (isTerm(op)) {
        current = { ...state.current, positive: state.current.positive.div(100) };
      } else {
        const { n } = stack2nd(state.stack) as StackNumElement;
        const r = { ...state.current };
        r.positive = r.positive.div(100);
        current = apply("*", n, r);
      }
      return {
        ...state,
        current,
        input: false,
      };
    }
    case StateType.num_entered: {
      const top = stackTop(state.stack);

      let current;
      if (top && top.type === "op" && !isTerm(top.op)) {
        const val = evalStack(state.stack.slice(0, state.stack.length - 1));
        const p = { minus: state.current.minus, positive: state.current.positive.div(100) };
        current = apply("*", val, p);
      } else {
        current = { ...state.current, positive: state.current.positive.div(100) };
      }
      return {
        ...state,
        current,
        input: false,
      };
    }
  }
};

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

interface ExtraState extends State {
  inputCount: number;
}

export const extraInitialState: ExtraState = { ...initialState, inputCount: 0 };

export const withInputRestriction =
  (reducer: (state: State, action: Action) => State, maxCount = 9) =>
  (state: ExtraState, action: Action): ExtraState => {
    switch (action.type) {
      case "lit":
        if (state.inputCount < maxCount) {
          return { ...reducer(state, action), inputCount: state.inputCount + 1 };
        } else {
          return state;
        }
      case "op":
        switch (action.op) {
          case ".":
            if (state.inputCount < maxCount) {
              const inputCount =
                state.type === StateType.num_entered ? state.inputCount : state.inputCount + 1;
              return { ...reducer(state, action), inputCount };
            } else {
              return state;
            }
          case "+/-":
            return { ...reducer(state, action), inputCount: state.inputCount };
          default:
            return { ...reducer(state, action), inputCount: 0 };
        }
    }
  };

export const getCurrent = (state: State): Decimal => toNum(state.current);

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
