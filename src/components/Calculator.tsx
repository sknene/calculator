import clsx from "clsx";
import { useReducer } from "react";
import { NumericLiteral } from "../domain/calc";
import {
  getActiveOp,
  getCurrent,
  initialState,
  isInputNumber,
  calculatorReducer,
} from "../domain/immutable-calc";

interface ButtonProps {
  type: "top" | "op" | "num";
  long?: boolean;
  active?: boolean;
  label: string;
  onClick?: () => void;
}

const Button: React.VFC<ButtonProps> = ({ type, long, active, label, onClick }) => (
  <button
    className={clsx(
      type === "top" ? "h-10" : "h-14",
      long && "col-span-2",
      active && "bg-gray-700 text-gray-50",
      "w-auto font-semibold text-lg text-gray-900 border border-gray-300 rounded shadow transition-all hover:opacity-60 active:shadow-inner"
    )}
    onClick={onClick}
  >
    {label}
  </button>
);

export const Calculator: React.VFC = () => {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);
  const activeOp = getActiveOp(state);
  const current = getCurrent(state);
  const inputNumber = isInputNumber(state);

  const handleClear = () => {
    dispatch({ type: "op", op: "C" });
  };
  const handleAllClear = () => {
    dispatch({ type: "op", op: "AC" });
  };
  const handleAdd = () => {
    dispatch({ type: "op", op: "+" });
  };
  const handleSub = () => {
    dispatch({ type: "op", op: "-" });
  };
  const handleMul = () => {
    dispatch({ type: "op", op: "*" });
  };
  const handleDiv = () => {
    dispatch({ type: "op", op: "/" });
  };
  const handlePoint = () => {
    dispatch({ type: "op", op: "." });
  };
  const handlePercent = () => {
    dispatch({ type: "op", op: "%" });
  };
  const handlePlusMinus = () => {
    dispatch({ type: "op", op: "+/-" });
  };
  const handleEq = () => {
    dispatch({ type: "op", op: "=" });
  };
  const handleNum = (n: NumericLiteral) => () => {
    dispatch({ type: "lit", n });
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="w-80 p-7 border border-gray-300 bg-gray-50 shadow-lg">
        <button className="h-20 mb-8 text-gray-50 text-5xl bg-gray-400 rounded shadow-inner">
          <svg className="w-full h-full" width="265" height="80" viewBox="0 0 265 80">
            <text x="250" y="60" textAnchor="end" fill="currentColor">
              {current.toLocaleString()}
            </text>
          </svg>
        </button>
        <div className="grid grid-cols-4 gap-3">
          {inputNumber ? (
            <Button type="top" label="C" onClick={handleClear} />
          ) : (
            <Button type="top" label="AC" onClick={handleAllClear} />
          )}
          <Button type="top" label="+/-" onClick={handlePlusMinus} />
          <Button type="top" label="%" onClick={handlePercent} />
          <Button type="op" label="÷" active={activeOp === "/"} onClick={handleDiv} />

          <Button type="num" label="7" onClick={handleNum(7)} />
          <Button type="num" label="8" onClick={handleNum(8)} />
          <Button type="num" label="9" onClick={handleNum(9)} />
          <Button type="op" label="×" active={activeOp === "*"} onClick={handleMul} />

          <Button type="num" label="4" onClick={handleNum(4)} />
          <Button type="num" label="5" onClick={handleNum(5)} />
          <Button type="num" label="6" onClick={handleNum(6)} />
          <Button type="op" label="-" active={activeOp === "-"} onClick={handleSub} />

          <Button type="num" label="1" onClick={handleNum(1)} />
          <Button type="num" label="2" onClick={handleNum(2)} />
          <Button type="num" label="3" onClick={handleNum(3)} />
          <Button type="op" label="+" active={activeOp === "+"} onClick={handleAdd} />

          <Button type="num" long={true} label="0" onClick={handleNum(0)} />
          <Button type="num" label="." onClick={handlePoint} />
          <Button type="op" label="=" onClick={handleEq} />
        </div>
      </div>
    </div>
  );
};
