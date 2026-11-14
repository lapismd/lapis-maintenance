import type { MaintenanceCommand, CommandResult } from "../types";
export interface DispatchInput {
  name: string;
  description: string;
  type: "string" | "choice" | "boolean" | "number" | "environment";
  required: boolean;
  default?: string;
  options?: string[];
}
export interface DispatchWorkflow {
  id: number;
  name: string;
  path: string;
  url: string;
  inputs: DispatchInput[];
}
export interface DispatchRef {
  name: string;
  kind: "branch" | "tag";
  sha: string;
  ref: string;
}
export interface DispatchTarget {
  workflow: DispatchWorkflow;
  ref: DispatchRef;
  definitionSha: string;
  defaultDefinitionSha: string;
  inputs: DispatchInput[];
  environments: string[];
}
export interface DispatchPort {
  discover(
    repository: string,
    signal: AbortSignal,
  ): Promise<{
    workflows: DispatchWorkflow[];
    refs: DispatchRef[];
    warnings: string[];
  }>;
  target(
    repository: string,
    workflow: DispatchWorkflow,
    ref: DispatchRef,
    signal: AbortSignal,
  ): Promise<DispatchTarget>;
  execute(
    command: MaintenanceCommand,
    signal: AbortSignal,
  ): Promise<CommandResult>;
}
