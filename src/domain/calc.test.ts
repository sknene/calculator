import { CalculatorModel, NumericLiteral, Op } from "./calc";

type InputEvent = { type: "lit"; n: NumericLiteral } | { type: "op"; op: Op };

type K = (events: Array<InputEvent>, expected: number) => void;

export const createMakeCase =
  (handler: K): K =>
  (events, expected) => {
    let name = "";
    events.forEach((event) => {
      name += event.type == "lit" ? event.n : event.op;
      name += " ";
    });

    test(`${name}=> ${expected}`, () => handler(events, expected));
  };

const makeCase = createMakeCase((events, expected) => {
  const model = new CalculatorModel();

  events.forEach((event) => {
    switch (event.type) {
      case "lit":
        return model.num(event.n);

      case "op":
        switch (event.op) {
          case "%":
            return model.percent();
          case "*":
            return model.mul();
          case "+":
            return model.add();
          case "-":
            return model.sub();
          case "/":
            return model.div();
          case "AC":
            return model.allClear();
          case "C":
            return model.clear();
          case "+/-":
            return model.plusMinus();
          case ".":
            return model.point();
          case "=":
            return model.eq();
        }
    }
  });

  expect(model.getCurrent()).toBe(expected);
});

export const createCases = (makeCase: K): void => {
  makeCase(
    [
      { type: "lit", n: 1 },
      { type: "op", op: "+" },
      { type: "lit", n: 2 },
      { type: "op", op: "=" },
    ],
    3
  );

  makeCase(
    [
      { type: "lit", n: 3 },
      { type: "op", op: "+" },
      { type: "op", op: "=" },
    ],
    6
  );
  makeCase(
    [
      { type: "lit", n: 1 },
      { type: "op", op: "+" },
      { type: "lit", n: 3 },
      { type: "op", op: "-" },
      { type: "op", op: "=" },
    ],
    0
  );
  makeCase(
    [
      { type: "lit", n: 2 },
      { type: "op", op: "+" },
      { type: "lit", n: 3 },
    ],
    3
  );
  makeCase(
    [
      { type: "lit", n: 2 },
      { type: "op", op: "+" },
      { type: "lit", n: 3 },
      { type: "op", op: "+" },
      { type: "op", op: "*" },
      { type: "op", op: "=" },
    ],
    11
  );

  describe("literal", () => {
    makeCase([{ type: "lit", n: 1 }], 1);
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "lit", n: 2 },
      ],
      12
    );
  });

  describe("add, sub", () => {
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 2 },
        { type: "op", op: "=" },
      ],
      3
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
      ],
      6
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "-" },
        { type: "lit", n: 2 },
        { type: "op", op: "=" },
      ],
      -1
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "-" },
        { type: "lit", n: 2 },
        { type: "op", op: "-" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
      ],
      -4
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 2 },
        { type: "op", op: "-" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
      ],
      0
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "-" },
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
      ],
      2
    );
  });

  describe("mul, div", () => {
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "*" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
      ],
      6
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "*" },
        { type: "lit", n: 3 },
        { type: "op", op: "*" },
        { type: "lit", n: 4 },
        { type: "op", op: "=" },
      ],
      24
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "/" },
        { type: "lit", n: 4 },
        { type: "op", op: "=" },
      ],
      0.5
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "/" },
        { type: "lit", n: 4 },
        { type: "op", op: "/" },
        { type: "lit", n: 5 },
        { type: "op", op: "=" },
      ],
      0.1
    );
  });

  describe("precedence", () => {
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 4 },
        { type: "op", op: "*" },
        { type: "lit", n: 5 },
        { type: "op", op: "=" },
      ],
      22
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "-" },
        { type: "lit", n: 4 },
        { type: "op", op: "*" },
        { type: "lit", n: 5 },
        { type: "op", op: "=" },
      ],
      -18
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "*" },
        { type: "lit", n: 4 },
        { type: "op", op: "+" },
        { type: "lit", n: 5 },
        { type: "op", op: "=" },
      ],
      13
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "*" },
        { type: "lit", n: 4 },
        { type: "op", op: "-" },
        { type: "lit", n: 5 },
        { type: "op", op: "=" },
      ],
      3
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 2 },
        { type: "op", op: "*" },
        { type: "lit", n: 4 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "*" },
        { type: "lit", n: 5 },
        { type: "op", op: "=" },
      ],
      24
    );
  });

  describe("plus / minus", () => {
    makeCase(
      [
        { type: "op", op: "+/-" },
        { type: "lit", n: 5 },
      ],
      -5
    );
    makeCase(
      [
        { type: "lit", n: 5 },
        { type: "op", op: "+/-" },
      ],
      -5
    );
    makeCase(
      [
        { type: "lit", n: 5 },
        { type: "op", op: "+/-" },
        { type: "op", op: "+/-" },
      ],
      5
    );
    makeCase(
      [
        { type: "op", op: "+/-" },
        { type: "lit", n: 5 },
        { type: "op", op: "+/-" },
      ],
      5
    );
    makeCase(
      [
        { type: "lit", n: 5 },
        { type: "op", op: "+/-" },
        { type: "lit", n: 7 },
      ],
      -57
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "op", op: "+/-" },
        { type: "lit", n: 2 },
        { type: "op", op: "=" },
      ],
      -1
    );
    makeCase(
      [
        { type: "op", op: "+/-" },
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 2 },
        { type: "op", op: "=" },
      ],
      1
    );
  });

  describe("percent", () => {
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "%" },
      ],
      0.02
    );
    makeCase(
      [
        { type: "lit", n: 3 },
        { type: "op", op: "%" },
        { type: "op", op: "+" },
        { type: "lit", n: 2 },
        { type: "op", op: "=" },
      ],
      2.03
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      2.06
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "-" },
        { type: "lit", n: 3 },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      1.94
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "+/-" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      1.94
    );
    makeCase(
      [
        { type: "lit", n: 4 },
        { type: "op", op: "*" },
        { type: "lit", n: 5 },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      0.2
    );
    makeCase(
      [
        { type: "lit", n: 4 },
        { type: "op", op: "/" },
        { type: "lit", n: 5 },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      80
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "+" },
        { type: "lit", n: 4 },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      5.2
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "*" },
        { type: "lit", n: 3 },
        { type: "op", op: "+" },
        { type: "lit", n: 4 },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      6.24
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "*" },
        { type: "lit", n: 4 },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      2.12
    );

    makeCase(
      [
        { type: "lit", n: 3 },
        { type: "op", op: "+" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      3.09
    );
    makeCase(
      [
        { type: "lit", n: 3 },
        { type: "op", op: "-" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      2.91
    );
    makeCase(
      [
        { type: "lit", n: 3 },
        { type: "op", op: "+/-" },
        { type: "op", op: "+" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      -2.91
    );
    makeCase(
      [
        { type: "lit", n: 3 },
        { type: "op", op: "+/-" },
        { type: "op", op: "-" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      -3.09
    );
    makeCase(
      [
        { type: "lit", n: 3 },
        { type: "op", op: "*" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      0.09
    );
    makeCase(
      [
        { type: "lit", n: 3 },
        { type: "op", op: "+" },
        { type: "lit", n: 4 },
        { type: "op", op: "+" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      7.28
    );
    makeCase(
      [
        { type: "lit", n: 3 },
        { type: "op", op: "*" },
        { type: "lit", n: 4 },
        { type: "op", op: "+" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      12.48
    );
    makeCase(
      [
        { type: "lit", n: 3 },
        { type: "op", op: "+" },
        { type: "lit", n: 4 },
        { type: "op", op: "*" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      3.16
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "+" },
        { type: "lit", n: 4 },
        { type: "op", op: "+" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      9.36
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "*" },
        { type: "lit", n: 3 },
        { type: "op", op: "+" },
        { type: "lit", n: 4 },
        { type: "op", op: "+" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      10.4
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "*" },
        { type: "lit", n: 4 },
        { type: "op", op: "+" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      14.56
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "+" },
        { type: "lit", n: 4 },
        { type: "op", op: "*" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      5.16
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "+/-" },
        { type: "op", op: "+" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      -0.97
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "+" },
        { type: "lit", n: 4 },
        { type: "op", op: "+/-" },
        { type: "op", op: "+" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      0.96
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "%" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
      ],
      5
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "%" },
        { type: "op", op: "+/-" },
        { type: "op", op: "=" },
      ],
      1.94
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "%" },
        { type: "op", op: "." },
        { type: "op", op: "=" },
      ],
      2
    );
  });

  describe("point", () => {
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "." },
        { type: "lit", n: 3 },
      ],
      2.3
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "." },
        { type: "lit", n: 3 },
        { type: "op", op: "." },
      ],
      2.3
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "." },
        { type: "lit", n: 3 },
        { type: "op", op: "+" },
        { type: "lit", n: 5 },
        { type: "op", op: "=" },
      ],
      7.3
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "." },
        { type: "lit", n: 2 },
        { type: "op", op: "=" },
      ],
      4.2
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "op", op: "." },
        { type: "lit", n: 2 },
        { type: "op", op: "=" },
      ],
      1.2
    );
  });

  describe("after eq", () => {
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
        { type: "lit", n: 9 },
      ],
      9
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
        { type: "lit", n: 9 },
        { type: "op", op: "=" },
      ],
      12
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
        { type: "op", op: "%" },
      ],
      0.04
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
        { type: "op", op: "%" },
        { type: "op", op: "=" },
      ],
      3.04
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
        { type: "op", op: "+/-" },
      ],
      -4
    );
    makeCase(
      [
        { type: "lit", n: 2 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
        { type: "op", op: "+/-" },
        { type: "op", op: "=" },
      ],
      -2
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
        { type: "op", op: "-" },
      ],
      4
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
        { type: "op", op: "-" },
        { type: "lit", n: 7 },
        { type: "op", op: "=" },
      ],
      -3
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
        { type: "op", op: "=" },
      ],
      7
    );
    makeCase(
      [
        { type: "lit", n: 1 },
        { type: "op", op: "+" },
        { type: "lit", n: 3 },
        { type: "op", op: "=" },
        { type: "op", op: "=" },
        { type: "lit", n: 1 },
        { type: "op", op: "=" },
      ],
      4
    );
  });
};

createCases(makeCase);
