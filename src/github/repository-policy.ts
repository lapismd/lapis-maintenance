import { validRepository, type RepositoryDefault } from "./models";

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function repositories(value: unknown): string[] {
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string" || !validRepository(entry))
  )
    throw new Error("Invalid monitoring repository list");
  return value;
}

/** Monitoring selects reads; it never supplies command or update authority. */
export function repositoryDefaults(config: unknown): RepositoryDefault[] {
  if (!record(config) || !Array.isArray(config.repositories))
    throw new Error("Invalid repository allowlist");
  const defaults = new Map<string, RepositoryDefault>();
  for (const entry of config.repositories) {
    if (
      !record(entry) ||
      typeof entry.repository !== "string" ||
      !validRepository(entry.repository) ||
      (entry.holdReason !== undefined &&
        (typeof entry.holdReason !== "string" || !entry.holdReason.trim()))
    )
      throw new Error("Invalid repository default or hold");
    defaults.set(entry.repository, {
      repository: entry.repository,
      ...(typeof entry.holdReason === "string"
        ? { holdReason: entry.holdReason }
        : {}),
    });
  }
  if (config.monitoring !== undefined) {
    if (!record(config.monitoring))
      throw new Error("Invalid monitoring policy");
    for (const repository of repositories(config.monitoring.repositories))
      if (!defaults.has(repository)) defaults.set(repository, { repository });
    for (const repository of repositories(
      config.monitoring.excludedRepositories,
    ))
      defaults.delete(repository);
  }
  return [...defaults.values()];
}
