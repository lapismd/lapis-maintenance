import { expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import App from "./App.svelte";
import { credentialKey } from "../session/device-store";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";
it("schedules auto-merge through the production session on activation and retains the PR", async () => {
  localStorage.removeItem(credentialKey);
  const sha = "a".repeat(40),
    repository = "lapismd/dependency-automation";
  const pr = {
    state: "open",
    number: 71,
    title: "Update verified dependency",
    body: "Reviewed release",
    user: { login: "automation" },
    node_id: "PR_test",
    draft: false,
    updated_at: new Date().toISOString(),
    head: { sha, ref: "update" },
    base: { ref: "main" },
    html_url: `https://github.com/${repository}/pull/71`,
    labels: [],
    mergeable: true,
    mergeable_state: "blocked",
    auto_merge: null as {
      merge_method: "squash";
      enabled_by: { login: string };
    } | null,
  };
  const mutations: RequestInit[] = [];
  const nativeFetch = globalThis.fetch.bind(globalThis);
  const send = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input, init) => {
      const url = new URL(String(input), location.href),
        path = url.pathname;
      if (url.origin !== "https://api.github.com")
        return nativeFetch(input, init);
      if (path === "/graphql") {
        const body = JSON.parse(String(init?.body));
        if (body.query.trimStart().startsWith("mutation")) {
          mutations.push(init!);
          expect(body.query).toContain("enablePullRequestAutoMerge");
          expect(body.variables.input).toEqual({
            pullRequestId: "PR_test",
            expectedHeadOid: sha,
            mergeMethod: "SQUASH",
          });
          pr.auto_merge = {
            merge_method: "squash",
            enabled_by: { login: "maintainer" },
          };
          return Response.json({
            data: {
              enablePullRequestAutoMerge: {
                pullRequest: {
                  id: "PR_test",
                  headRefOid: sha,
                  autoMergeRequest: { mergeMethod: "SQUASH" },
                },
              },
            },
          });
        }
        expect(body.query.trimStart()).toMatch(/^query\b/);
        return Response.json({ errors: [{ message: "Use REST fixture" }] });
      }
      if (init?.method !== "GET")
        throw Error(
          "Unexpected write outside the confirmed auto-merge mutation",
        );
      if (path === "/user")
        return Response.json({
          id: 987654322,
          login: "maintainer",
          name: "Test Maintainer",
          avatar_url: "",
          html_url: "https://github.com/maintainer",
        });
      if (path.endsWith("repositories.json"))
        return Response.json({ repositories: [] });
      if (path.endsWith("/pulls")) return Response.json([pr]);
      if (path.endsWith("/pulls/71")) return Response.json(pr);
      if (path.endsWith("/check-runs"))
        return Response.json({
          check_runs: [
            {
              id: 1,
              name: "CI",
              head_sha: sha,
              status: "completed",
              conclusion: "success",
            },
          ],
        });
      if (path.endsWith("/reviews"))
        return Response.json([
          {
            id: 1,
            state: "APPROVED",
            commit_id: sha,
            user: { login: "reviewer" },
          },
        ]);
      if (path.endsWith("/statuses")) return Response.json([]);
      if (path.endsWith("/actions/runs"))
        return Response.json({ workflow_runs: [] });
      return Response.json({
        full_name: repository,
        default_branch: "main",
        permissions: { push: true },
        allow_squash_merge: true,
        allow_auto_merge: true,
      });
    });
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(App, { target });
  try {
    await page
      .getByLabelText("GitHub token")
      .fill(`invented-write-${crypto.randomUUID()}`);
    await page.getByRole("button", { name: "Connect GitHub" }).click();
    await page
      .getByRole("button", { name: /Open card: Update verified dependency/ })
      .click();
    await expect
      .element(page.getByRole("button", { name: "Enable auto-merge" }))
      .toBeEnabled();
    expect(mutations).toHaveLength(0);
    await page.getByRole("button", { name: "Enable auto-merge" }).click();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect
      .element(page.getByRole("heading", { name: "1 item in view" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Disable auto-merge" }))
      .toBeEnabled();
    expect(mutations).toHaveLength(1);
    await expect.element(page.getByText(/^Auto-merge enabled ·/)).toBeVisible();
    await expect
      .element(page.getByText("GitHub · accepted", { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByText("Preview · accepted", { exact: true }))
      .not.toBeInTheDocument();
    await expect
      .element(
        page.getByRole("button", {
          name: /Open status log:.*GitHub enabled auto-merge/,
        }),
      )
      .toBeVisible();
    await page
      .getByRole("button", { name: /Open profile menu for.*Test Maintainer/ })
      .click();
    await page.getByRole("menuitem", { name: "Settings" }).click();
    await page.getByRole("button", { name: "Disconnect GitHub" }).click();
  } finally {
    await unmount(app);
    target.remove();
    localStorage.removeItem(credentialKey);
    send.mockRestore();
  }
}, 30_000);
