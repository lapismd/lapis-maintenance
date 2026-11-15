import { expect, it, vi } from "vitest";
import { discoverRepositories } from "./repository-discovery";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import { validRepository } from "./models";

async function discover(
  config: unknown,
  additions: string[] = [],
  exclusions: string[] = [],
) {
  const send = vi.fn<typeof fetch>(async () => Response.json(config));
  const client = new GithubTransport(
    "invented",
    new MemoryResponseCache(),
    send,
  );
  try {
    const result = await discoverRepositories(
      client,
      { additions, exclusions },
      new AbortController().signal,
      {},
    );
    expect(send.mock.calls).toHaveLength(1);
    expect(send.mock.calls[0]?.[1]?.method ?? "GET").toBe("GET");
    return result;
  } finally {
    client.dispose();
  }
}

it("combines monitoring defaults with update targets, retaining holds and excluding parked defaults", async () => {
  const result = await discover({
    repositories: [
      {
        repository: "lapismd/lapis-desktop",
        holdReason: "Qualified archive intake required",
      },
      { repository: "lapismd/terminal-host" },
    ],
    monitoring: {
      repositories: [
        "lapismd/.github",
        "lapismd/lapis-maintenance",
        "lapismd/lapis-desktop",
      ],
      excludedRepositories: ["lapismd/terminal-host"],
    },
  });
  expect([...result.repositories.keys()]).toEqual([
    "lapismd/dependency-automation",
    "lapismd/lapis-desktop",
    "lapismd/.github",
    "lapismd/lapis-maintenance",
  ]);
  expect(result.repositories.get("lapismd/lapis-desktop")?.holdReason).toBe(
    "Qualified archive intake required",
  );
  expect(result.coverage).toEqual([]);
});

it("preserves legacy policy and explicit operator selections", async () => {
  const result = await discover(
    { repositories: [{ repository: "owner/legacy" }] },
    ["owner/extra"],
    ["owner/legacy"],
  );
  expect([...result.repositories.keys()]).toEqual([
    "lapismd/dependency-automation",
    "owner/extra",
  ]);
  expect(result.defaults.map((entry) => entry.repository)).toContain(
    "owner/legacy",
  );
});

it("reports malformed monitoring policy rather than silently omitting coverage", async () => {
  for (const monitoring of [
    null,
    { repositories: "owner/extra" },
    { excludedRepositories: ["../escape"] },
  ]) {
    const result = await discover(
      { repositories: [{ repository: "owner/legacy" }], monitoring },
      ["owner/extra"],
    );
    expect(result.coverage[0]?.available).toBe(false);
    expect([...result.repositories.keys()]).toEqual([
      "lapismd/dependency-automation",
      "owner/extra",
    ]);
  }
});

it("accepts the real .github repository while rejecting path and URL injection", () => {
  expect(validRepository("lapismd/.github")).toBe(true);
  for (const value of [
    "owner/.",
    "owner/..",
    "../escape",
    "owner/repo/path",
    "https://github.com/owner/repo",
    "owner/repo?x=1",
  ])
    expect(validRepository(value)).toBe(false);
});
