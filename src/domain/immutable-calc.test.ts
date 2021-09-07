import { toNum } from "./calc";
import { createMakeCase, createCases } from "./calc.test";
import { Action, getActiveOp, initialState, calculatorReducer } from "./immutable-calc";

const makeCase = createMakeCase((events, expected) => {
  const state = events.reduce(calculatorReducer, initialState);
  expect(toNum(state.current)).toBe(expected);
});

createCases(makeCase);

describe("active op", () => {
  test("initial", () => {
    const events: Array<Action> = [];
    const state = events.reduce(calculatorReducer, initialState);
    expect(getActiveOp(state)).toBe(undefined);
  });
  test("+", () => {
    const events: Array<Action> = [{ type: "op", op: "+" }];
    const state = events.reduce(calculatorReducer, initialState);
    expect(getActiveOp(state)).toBe("+");
  });
  test("1", () => {
    const events: Array<Action> = [{ type: "lit", n: 1 }];
    const state = events.reduce(calculatorReducer, initialState);
    expect(getActiveOp(state)).toBe(undefined);
  });
});
