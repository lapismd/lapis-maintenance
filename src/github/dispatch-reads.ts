import type { GithubTransport, ReadOptions } from "./transport";
import type {
  DispatchWorkflow,
  DispatchRef,
  DispatchTarget,
} from "../maintenance/dispatch/types";
import type { GithubRepository } from "./models";
import { validRepository } from "./models";
import { parseDispatch } from "./dispatch-model";
interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
  html_url: string;
}
interface Ref {
  name: string;
  commit: { sha: string };
}
export class DispatchReads {
  constructor(readonly client: GithubTransport) {}
  async definition(
    repository: string,
    path: string,
    ref: string,
    signal: AbortSignal,
    options: ReadOptions = {},
  ) {
    if (!/^\.github\/workflows\/[^/]+\.ya?ml$/.test(path))
      throw new Error("Workflow file is outside .github/workflows.");
    const file = await this.client.read<{
      encoding: string;
      content: string;
      sha: string;
      size: number;
    }>(
      `/repos/${repository}/contents/${path}?ref=${encodeURIComponent(ref)}`,
      signal,
      options,
    );
    if (file.encoding !== "base64" || file.size > 262144)
      throw new Error("Workflow definition is unavailable or too large.");
    const bytes = Uint8Array.from(atob(file.content.replace(/\s/g, "")), (c) =>
      c.charCodeAt(0),
    );
    const inputs = parseDispatch(new TextDecoder().decode(bytes));
    if (!inputs)
      throw new Error(
        "This workflow does not declare workflow_dispatch at the selected ref.",
      );
    return { sha: file.sha, inputs };
  }
  async discover(repository: string, signal: AbortSignal) {
    if (!validRepository(repository))
      throw new Error("Choose a repository first.");
    const root = `/repos/${repository}`;
    const [metadata, workflows, branches, tags] = await Promise.all([
      this.client.read<GithubRepository>(root, signal),
      this.client.pages<Workflow>(
        `${root}/actions/workflows?per_page=100`,
        signal,
        {},
        "workflows",
      ),
      this.client.pages<Ref>(`${root}/branches?per_page=100`, signal),
      this.client.pages<Ref>(`${root}/tags?per_page=100`, signal),
    ]);
    const warnings: string[] = [],
      found: DispatchWorkflow[] = [];
    await Promise.all(
      workflows
        .filter((w) => w.state === "active")
        .map(async (workflow) => {
          try {
            const definition = await this.definition(
              repository,
              workflow.path,
              metadata.default_branch,
              signal,
            );
            found.push({
              id: workflow.id,
              name: workflow.name,
              path: workflow.path,
              url: `https://github.com/${repository}/actions/workflows/${encodeURIComponent(workflow.path.split("/").at(-1)!)}`,
              inputs: definition.inputs,
            });
          } catch (error) {
            signal.throwIfAborted();
            if (
              !(error instanceof Error) ||
              !error.message.includes("does not declare workflow_dispatch")
            )
              warnings.push(
                `${workflow.name}: ${error instanceof Error ? error.message : "Definition unavailable"}`,
              );
          }
        }),
    );
    return {
      workflows: found.sort((a, b) => a.name.localeCompare(b.name)),
      warnings,
      refs: [
        ...branches.map((r) => ({
          ...r,
          kind: "branch" as const,
          sha: r.commit.sha,
          ref: `refs/heads/${r.name}`,
        })),
        ...tags.map((r) => ({
          ...r,
          kind: "tag" as const,
          sha: r.commit.sha,
          ref: `refs/tags/${r.name}`,
        })),
      ],
    };
  }
  async target(
    repository: string,
    workflow: DispatchWorkflow,
    ref: DispatchRef,
    signal: AbortSignal,
    options: ReadOptions = {},
  ): Promise<DispatchTarget> {
    const root = `/repos/${repository}`;
    const [metadata, current, commit] = await Promise.all([
      this.client.read<GithubRepository>(root, signal, options),
      this.client.read<Workflow>(
        `${root}/actions/workflows/${workflow.id}`,
        signal,
        options,
      ),
      this.client.read<{ sha: string }>(
        `${root}/commits/${encodeURIComponent(ref.ref)}`,
        signal,
        options,
      ),
    ]);
    if (
      current.state !== "active" ||
      current.path !== workflow.path ||
      metadata.archived ||
      metadata.disabled
    )
      throw new Error("This workflow or repository is no longer active.");
    const [definition, defaultDefinition] = await Promise.all([
      this.definition(repository, current.path, ref.ref, signal, options),
      this.definition(
        repository,
        current.path,
        metadata.default_branch,
        signal,
        options,
      ),
    ]);
    const environments = definition.inputs.some((i) => i.type === "environment")
      ? await this.client.pages<{ name: string }>(
          `${root}/environments?per_page=100`,
          signal,
          options,
          "environments",
        )
      : [];
    return {
      workflow: { ...workflow, inputs: definition.inputs },
      ref: { ...ref, sha: commit.sha },
      definitionSha: definition.sha,
      defaultDefinitionSha: defaultDefinition.sha,
      inputs: definition.inputs,
      environments: environments.map((e) => e.name),
    };
  }
}
