import { expect, it } from "vitest";
import { parseDispatch, validateInputs } from "./dispatch-model";
const source = `name: Manual\non:\n  workflow_dispatch:\n    inputs:\n      mode:\n        type: choice\n        options: [check, publish]\n        default: check\n        required: true\n      enabled:\n        type: boolean\n        default: false\n      count:\n        type: number\n        required: true\n      destination:\n        type: environment\n`;
it("reads typed dispatch contracts without coercing the on key or running YAML tags", () => {
  const inputs = parseDispatch(source)!;
  expect(inputs.map((i) => i.type)).toEqual([
    "choice",
    "boolean",
    "number",
    "environment",
  ]);
  expect(inputs[1]!.default).toBe("false");
  expect(
    validateInputs(
      inputs,
      { mode: "check", enabled: "false", count: "3", destination: "preview" },
      ["preview"],
    ),
  ).toEqual({
    mode: "check",
    enabled: "false",
    count: "3",
    destination: "preview",
  });
});
it.each([
  { mode: "bad", count: "1" },
  { mode: "check", count: "NaN" },
  { mode: "check", count: "" },
  { mode: "check", count: "1", enabled: "yes" },
  { mode: "check", count: "1", destination: "production" },
  { mode: "check", count: "1", extra: "hidden" },
])("rejects invalid or undeclared input %j", (values) => {
  expect(() =>
    validateInputs(
      parseDispatch(source)!,
      values as unknown as Record<string, string>,
      ["preview"],
    ),
  ).toThrow();
});
it("distinguishes non-dispatch workflows and rejects unsafe, duplicate or unsupported definitions", () => {
  expect(parseDispatch("on: push")).toBeUndefined();
  expect(parseDispatch("on: [push, workflow_dispatch]")).toEqual([]);
  expect(parseDispatch("on:\n  workflow_dispatch:")).toEqual([]);
  for (const yaml of [
    "on: !!js/function function(){}",
    "on: push\non: workflow_dispatch",
    "on:\n  workflow_dispatch:\n    inputs:\n      x:\n        type: secret",
  ])
    expect(() => parseDispatch(yaml)).toThrow();
});
