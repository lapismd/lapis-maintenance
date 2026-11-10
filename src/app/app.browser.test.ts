import { expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import App from "./App.svelte";
import { credentialKey } from "../session/device-store";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";
it("logs in, restores a remembered token against the real cache, and disconnects through the profile menu", async () => {
  const token = `invented-browser-${crypto.randomUUID()}`;
  localStorage.removeItem(credentialKey);
  const nativeFetch = globalThis.fetch.bind(globalThis);
  const requests: string[] = [];
  const send = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input, init) => {
      const url = new URL(String(input), location.href);
      if (url.origin !== "https://api.github.com")
        return nativeFetch(input, init);
      requests.push(url.pathname);
      expect(init?.method).toBe("GET");
      if (url.pathname === "/user")
        return Response.json({
          id: 987654321,
          login: "test-maintainer",
          name: "Browser Maintainer",
          avatar_url: "",
          html_url: "https://github.com/test-maintainer",
        });
      if (url.pathname.endsWith("/repositories.json"))
        return Response.json({ repositories: [] });
      if (url.pathname.endsWith("/pulls")) return Response.json([]);
      if (url.pathname.endsWith("/actions/runs"))
        return Response.json({ workflow_runs: [] });
      return Response.json({
        full_name: "lapismd/dependency-automation",
        default_branch: "main",
      });
    });
  const target = document.createElement("div");
  document.body.appendChild(target);
  let app = mount(App, { target });
  try {
    await expect
      .element(page.getByRole("heading", { name: "Lapis Maintenance" }))
      .toBeVisible();
    await expect
      .element(page.getByText(/To take actions, add Pull requests\s+write/))
      .toBeVisible();
    await page.getByLabelText("GitHub token").fill(token);
    await page.getByRole("button", { name: "Connect GitHub" }).click();
    await expect
      .element(
        page.getByRole("button", {
          name: /Open profile menu for.*Browser Maintainer/,
        }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "0 items in view" }))
      .toBeVisible();
    expect(JSON.parse(localStorage.getItem(credentialKey)!).token).toBe(token);
    await expect
      .element(page.getByRole("button", { name: "Refresh", exact: true }))
      .toBeEnabled();
    const initialReads = requests.filter((path) => path !== "/user").length;
    await unmount(app);
    target.replaceChildren();
    app = mount(App, { target });
    await expect
      .element(
        page.getByRole("button", {
          name: /Open profile menu for.*Browser Maintainer/,
        }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "0 items in view" }))
      .toBeVisible();
    expect(requests.filter((path) => path === "/user")).toHaveLength(2);
    expect(requests.filter((path) => path !== "/user")).toHaveLength(
      initialReads,
    );
    await page
      .getByRole("button", {
        name: /Open profile menu for.*Browser Maintainer/,
      })
      .click();
    await page.getByRole("menuitem", { name: "Settings" }).click();
    await expect
      .element(page.getByText("GitHub · actions follow token permissions"))
      .toBeVisible();
    await page.getByRole("button", { name: "Disconnect GitHub" }).click();
    await expect
      .element(page.getByRole("heading", { name: "Lapis Maintenance" }))
      .toBeVisible();
    expect(localStorage.getItem(credentialKey)).toBeNull();
  } finally {
    await unmount(app);
    target.remove();
    localStorage.removeItem(credentialKey);
    send.mockRestore();
  }
}, 30_000);
