import { parseDocument } from "yaml";
import type { DispatchInput } from "../maintenance/dispatch/types";
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
export function parseDispatch(source: string): DispatchInput[] | undefined {
  if (source.length > 262144)
    throw new Error("Workflow definition exceeds the supported size.");
  const document = parseDocument(source, { schema: "core", uniqueKeys: true });
  if (document.errors.length || document.warnings.length)
    throw new Error("Workflow YAML has unsupported tags or invalid structure.");
  const yaml = document.toJS({ maxAliasCount: 0 });
  if (!object(yaml)) throw new Error("Workflow definition must be a mapping.");
  const on = yaml.on;
  if (
    on === "workflow_dispatch" ||
    (Array.isArray(on) && on.includes("workflow_dispatch"))
  )
    return [];
  if (!object(on) || !("workflow_dispatch" in on)) return;
  const dispatch = on.workflow_dispatch;
  if (dispatch == null) return [];
  if (!object(dispatch))
    throw new Error("Invalid workflow_dispatch definition.");
  const inputs = dispatch.inputs ?? {};
  if (!object(inputs) || Object.keys(inputs).length > 25)
    throw new Error("Invalid dispatch inputs (maximum 25).");
  return Object.entries(inputs).map(([name, config]) => {
    if (!object(config) || !/^[\w-]+$/.test(name))
      throw new Error(`Invalid input: ${name}`);
    const type = config.type ?? "string";
    if (
      !["string", "choice", "boolean", "number", "environment"].includes(
        String(type),
      )
    )
      throw new Error(`Unsupported input type for ${name}.`);
    const options = config.options;
    if (
      type === "choice" &&
      (!Array.isArray(options) ||
        !options.length ||
        !options.every((o) => typeof o === "string"))
    )
      throw new Error(`Invalid choices for ${name}.`);
    if (
      config.default != null &&
      !["string", "boolean", "number"].includes(typeof config.default)
    )
      throw new Error(`Invalid default for ${name}.`);
    return {
      name,
      type: type as DispatchInput["type"],
      description: String(config.description ?? name),
      required: config.required === true,
      default: config.default == null ? undefined : String(config.default),
      options: type === "choice" ? (options as string[]) : undefined,
    };
  });
}
export { validateInputs } from "../maintenance/dispatch/input-validation";
