import type { RepositoryCoverage } from "../maintenance/types";
import { repositoryDefaults } from "./repository-policy";
import {
  validRepository,
  type RepositoryDefault,
  type RepositorySelection,
} from "./models";
import {
  GithubError,
  type GithubTransport,
  type ReadOptions,
} from "./transport";
const coordinator = "lapismd/dependency-automation";
export async function discoverRepositories(
  client: GithubTransport,
  preferences: RepositorySelection,
  signal: AbortSignal,
  options: ReadOptions,
) {
  let defaults: RepositoryDefault[] = [{ repository: coordinator }];
  const coverage: RepositoryCoverage[] = [];
  try {
    const config = await client.read<unknown>(
      `/repos/${coordinator}/contents/config/repositories.json`,
      signal,
      { ...options, accept: "application/vnd.github.raw+json" },
    );
    defaults = [...defaults, ...repositoryDefaults(config)];
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof GithubError && error.status === 401) throw error;
    coverage.push({
      repository: coordinator,
      available: false,
      reason:
        "Could not discover the current repository allowlist. Explicit additions are still checked.",
    });
  }
  const repositories = new Map(
    defaults.map((entry) => [entry.repository, entry]),
  );
  for (const repository of preferences.additions)
    if (validRepository(repository) && !repositories.has(repository))
      repositories.set(repository, { repository });
  for (const repository of preferences.exclusions)
    repositories.delete(repository);
  return {
    repositories,
    coverage,
    defaults: [
      ...new Map(defaults.map((entry) => [entry.repository, entry])).values(),
    ],
  };
}
