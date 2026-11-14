import type { DispatchInput } from "./types";
export function validateInputs(
  inputs: DispatchInput[],
  values: Record<string, string>,
  environments: string[],
): Record<string, string> {
  if (Object.keys(values).some((name) => !inputs.some((i) => i.name === name)))
    throw new Error("An undeclared workflow input was supplied.");
  const result: Record<string, string> = {};
  for (const input of inputs) {
    const value = values[input.name] ?? input.default ?? "";
    if (!value && input.required) throw new Error(`${input.name} is required.`);
    if (!value) continue;
    if (input.type === "boolean" && !["true", "false"].includes(value))
      throw new Error(`${input.name} must be true or false.`);
    if (
      input.type === "number" &&
      (!value.trim() || !Number.isFinite(Number(value)))
    )
      throw new Error(`${input.name} must be a finite number.`);
    if (input.type === "choice" && !input.options?.includes(value))
      throw new Error(`${input.name} must be a declared choice.`);
    if (input.type === "environment" && !environments.includes(value))
      throw new Error(`${input.name} must be an existing environment.`);
    result[input.name] = value;
  }
  if (new TextEncoder().encode(JSON.stringify(result)).length > 65535)
    throw new Error("Workflow inputs exceed 65,535 bytes.");
  return result;
}
