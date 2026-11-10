import { expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import App from "./App.svelte";
import { credentialKey } from "../session/device-store";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";
it("uses the production session for a confirmed, SHA-bound merge and refreshes the result", async () => {
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
    mergeable_state: "clean",
  };
  let merged = false;
  const mutations: RequestInit[] = [];
  const nativeFetch = globalThis.fetch.bind(globalThis);
  const send = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input, init) => {
      const url = new URL(String(input), location.href),
        path = url.pathname;
      if (url.origin !== "https://api.github.com")
        return nativeFetch(input, init);
      if (init?.method !== "GET") {
        mutations.push(init!);
        expect(path).toBe(`/repos/${repository}/pulls/71/merge`);
        expect(init?.method).toBe("PUT");
        expect(JSON.parse(String(init?.body))).toEqual({
          sha,
          merge_method: "squash",
        });
        merged = true;
        return Response.json({ merged: true });
      }
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
      if (path.endsWith("/pulls")) return Response.json(merged ? [] : [pr]);
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
      .element(page.getByRole("button", { name: "Squash and merge" }))
      .toBeEnabled();
    expect(mutations).toHaveLength(0);
    await page.getByRole("button", { name: "Squash and merge" }).click();
    await expect
      .element(
        page.getByText(
          "This action changes GitHub. The target will be checked again immediately before submission.",
        ),
      )
      .toBeVisible();
    expect(mutations).toHaveLength(0);
    await page.getByRole("button", { name: "Confirm GitHub action" }).click();
    await expect
      .element(page.getByRole("heading", { name: "0 items in view" }))
      .toBeVisible();
    expect(mutations).toHaveLength(1);
    await expect
      .element(
        page.getByRole("button", { name: /Open status log:.*GitHub merged/ }),
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
