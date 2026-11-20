import { expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { mount, unmount, tick } from "svelte";
import MaintenanceScreen from "../components/maintenance/MaintenanceScreen.svelte";
import { MaintenanceController } from "../maintenance/controller.svelte";
import { operatorFixture } from "../../catalog/operations/fixtures";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";
import OperationsPanel from "../components/maintenance-operations/OperationsPanel.svelte";
import type { DispatchController } from "../maintenance/dispatch/controller.svelte";

it("separates live state from coordinator intent and opens a host-owned recovery action", async () => {
  const snapshot = operatorFixture();
  const report = snapshot.coordinator!.report!;
  const repair = report.nodes.find(
    (node) => node.repository === "example/repair",
  )!;
  report.publications.push({
    name: "@example/foundation",
    version: "1.0.1",
    integrity: "sha512-fixture",
  });
  report.releases[0]!.version = "1.0.1";
  snapshot.repositories = [
    {
      repository: repair.repository,
      available: true,
      inventory: { pullRequests: true, workflows: true },
      actions: {
        branch: "main",
        sha: repair.sourceSha,
        state: "passed",
        workflows: 4,
        reason: "Four current-main workflows passed.",
      },
    },
  ];
  snapshot.items = [];
  const controller = new MaintenanceController(
    {
      readSnapshot: async () => snapshot,
      readDetails: vi.fn(),
      refreshRepository: async () => snapshot,
    },
    { execute: vi.fn() },
  );
  controller.view = "operations";
  await controller.refresh();
  const show = vi.fn();
  const dispatch = { show } as unknown as DispatchController;
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(OperationsPanel, {
    target,
    props: { controller, dispatch },
  });
  try {
    await expect
      .element(
        page.getByRole("button", {
          name: "Release intents and admission 1",
          exact: true,
        }),
      )
      .toBeVisible();
    await expect
      .element(page.getByText(/published 1\.0\.1; coordinator admission/))
      .toBeVisible();
    await page
      .getByRole("button", {
        name: /example\/repair No PR — Manual repair ownership branch reconciliation blocked before pr/,
      })
      .click();
    await expect
      .element(
        page.getByText("No open pull request observed.", { exact: true }),
      )
      .toBeVisible();
    await expect
      .element(
        page.getByText(
          "Observed coordinator source matches the refreshed default branch.",
        ),
      )
      .toBeVisible();
    await page
      .getByRole("button", {
        name: "example/repair: run coordinator workflow",
        exact: true,
      })
      .click();
    expect(show).toHaveBeenCalledWith("lapismd/dependency-automation");
  } finally {
    controller.dispose();
    await unmount(app);
    target.remove();
  }
});

it("targets the upstream owner when pre-PR publication work has no live PR", async () => {
  const snapshot = operatorFixture();
  const node = snapshot.coordinator!.report!.nodes[0]!;
  node.attention = [
    {
      code: "upstream-publication",
      category: "publication",
      summary: "Waiting for @example/foundation",
      detail: "upstream qualification/publication required",
      remediation: "Complete upstream qualification or publication.",
      repository: "example/foundation",
      package: "@lapismd/foundation",
    },
  ];
  snapshot.repositories = [
    {
      repository: node.repository,
      available: true,
      inventory: { pullRequests: true, workflows: true },
      actions: {
        branch: "main",
        sha: node.sourceSha,
        state: "passed",
        workflows: 1,
      },
    },
  ];
  snapshot.items = [];
  const controller = new MaintenanceController(
    {
      readSnapshot: async () => snapshot,
      readDetails: vi.fn(),
      refreshRepository: async () => snapshot,
    },
    { execute: vi.fn() },
  );
  controller.view = "operations";
  await controller.refresh();
  const show = vi.fn();
  const dispatch = { show } as unknown as DispatchController;
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(OperationsPanel, {
    target,
    props: { controller, dispatch },
  });
  try {
    const row = page.getByRole("button", {
      name: /example\/consumer No PR — Waiting for @example\/foundation publication blocked before pr github passed/,
    });
    await expect.element(row).toBeVisible();
    await row.click();
    await page
      .getByRole("button", {
        name: "example/consumer: run example/foundation workflow",
        exact: true,
      })
      .click();
    expect(show).toHaveBeenCalledWith("example/foundation");
  } finally {
    controller.dispose();
    await unmount(app);
    target.remove();
  }
});

it("loads coordinator evidence while the initial GitHub snapshot is still loading", async () => {
  const snapshot = operatorFixture();
  const readCoordinatorReport = vi.fn(async () => snapshot.coordinator!);
  const controller = new MaintenanceController(
    {
      readCoordinatorReport,
      readSnapshot: async () => snapshot,
      readDetails: vi.fn(),
      refreshRepository: async () => snapshot,
    },
    { execute: vi.fn() },
  );
  controller.phase = "loading";
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(OperationsPanel, { target, props: { controller } });
  try {
    await vi.waitFor(() =>
      expect(readCoordinatorReport).toHaveBeenCalledOnce(),
    );
    expect(readCoordinatorReport).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      { force: true },
    );
  } finally {
    controller.dispose();
    await unmount(app);
    target.remove();
  }
});
it("navigates to operator evidence and submits each eligible batch target once", async () => {
  const snapshot = operatorFixture();
  snapshot.coordinator = {
    state: "unavailable",
    reason: "Coordinator unavailable; manual controls remain available.",
  };
  const read = {
    readCoordinatorReport: vi.fn(async () => ({
      state: "unavailable" as const,
      reason: "Coordinator unavailable; manual controls remain available.",
    })),
    readSnapshot: async () => snapshot,
    refreshRepository: async () => snapshot,
    readDetails: vi.fn(),
  };
  const execute = vi.fn().mockResolvedValue({
    status: "accepted",
    message: "Simulated eligible rerun.",
  });
  const controller = new MaintenanceController(read, { execute });
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(MaintenanceScreen, {
    target,
    props: {
      controller,
      profile: {
        principal: "fixture",
        revision: 0,
        details: {
          display_name: "Fixture",
          description: "",
          avatar: null,
          email: null,
          gravatar: false,
        },
      },
      dark: false,
      onToggleTheme: () => {},
      onConnect: () => {},
    },
  });
  try {
    await controller.refresh();
    expect(read.readCoordinatorReport).not.toHaveBeenCalled();
    await page
      .getByRole("button", { name: "View waves, issues and decisions" })
      .click();
    await vi.waitFor(() =>
      expect(read.readCoordinatorReport).toHaveBeenCalledOnce(),
    );
    await expect
      .element(
        page.getByRole("heading", {
          name: "Dependency and release operations",
        }),
      )
      .toBeVisible();
    await page
      .getByRole("button", { name: /Review major framework compatibility/ })
      .click();
    await expect
      .element(
        page.getByRole("link", {
          name: /Review major framework compatibility/,
        }),
      )
      .toHaveAttribute(
        "href",
        "https://github.com/example/compatibility/issues/19",
      );
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await vi.waitFor(() =>
      expect(read.readCoordinatorReport).toHaveBeenCalledTimes(2),
    );
    expect(read.readCoordinatorReport).toHaveBeenLastCalledWith(
      expect.any(AbortSignal),
      { force: true },
    );
    await page.getByRole("button", { name: "Rerun eligible failures" }).click();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    expect(controller.commands.receipts.map((r) => r.status)).toEqual([
      "accepted",
      "accepted",
    ]);
  } finally {
    controller.dispose();
    await unmount(app);
    target.remove();
  }
});

it("shows repository refresh errors as a dismissible toast with details in the status log instead of inline Operations text", async () => {
  const snapshot = operatorFixture();
  snapshot.repositories[0] = {
    repository: "example/consumer",
    available: false,
    reason:
      "Workflow CI: GitHub could not resolve the requested resource reference (HTTP 422).",
  };
  const controller = new MaintenanceController(
    {
      readSnapshot: async () => structuredClone(snapshot),
      readDetails: vi.fn(),
      refreshRepository: async () => structuredClone(snapshot),
    },
    { execute: vi.fn() },
  );
  controller.view = "operations";
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(MaintenanceScreen, {
    target,
    props: {
      controller,
      profile: {
        principal: "fixture",
        revision: 0,
        details: {
          display_name: "Fixture",
          description: "",
          avatar: null,
          email: null,
          gravatar: false,
        },
      },
      dark: false,
      onToggleTheme: () => {},
      onConnect: () => {},
    },
  });
  try {
    await controller.refresh();
    expect(
      target.querySelector('[aria-label="Open GitHub issues"]')?.textContent,
    ).not.toContain("HTTP 422");
    await expect
      .element(page.getByRole("region", { name: "Notifications" }))
      .toBeVisible();
    await expect
      .element(
        page.getByText("Could not refresh example/consumer", { exact: true }),
      )
      .toBeVisible();
    await controller.refresh(true);
    await tick();
    expect(document.querySelectorAll("[data-notification-id]")).toHaveLength(1);
    await page
      .getByRole("button", { name: "View details", exact: true })
      .click();
    await expect
      .element(
        page.getByRole("region", { name: "Status log" }).getByText(/HTTP 422/),
      )
      .toBeVisible();
    await userEvent.keyboard("{Escape}");
    snapshot.repositories[0] = {
      repository: "example/consumer",
      available: true,
    };
    await controller.refresh(true);
    await tick();
    snapshot.repositories[0] = {
      repository: "example/consumer",
      available: false,
      reason:
        "Workflow CI: GitHub could not resolve the requested resource reference (HTTP 422).",
    };
    await controller.refresh(true);
    await tick();
    const dismiss = page.getByRole("button", {
      name: "Dismiss Could not refresh example/consumer",
    });
    await expect.element(dismiss).toBeVisible();
    dismiss.element().focus();
    await userEvent.keyboard("{Enter}");
    await expect
      .element(page.getByRole("region", { name: "Notifications" }))
      .not.toBeInTheDocument();
  } finally {
    controller.dispose();
    await unmount(app);
    target.remove();
  }
});

it("shows one current repository decision with only one previous value in expanded details, filtering after selection", async () => {
  const snapshot = operatorFixture();
  const base = snapshot.coordinator!.report!.operations[0]!;
  snapshot.coordinator!.report!.operations = [
    {
      ...base,
      id: "3".repeat(64),
      observedAt: "2026-11-15T20:00:00Z",
      status: "held",
      reason: "Latest verified policy decision",
    },
    {
      ...base,
      id: "1".repeat(64),
      observedAt: "2026-11-15T18:00:00Z",
      status: "unchanged",
      reason: "Obsolete poll result",
    },
    {
      ...base,
      id: "2".repeat(64),
      observedAt: "2026-11-15T19:00:00Z",
      status: "failed",
      reason: "Previous qualification failed",
    },
  ];
  const execute = vi.fn();
  const controller = new MaintenanceController(
    {
      readSnapshot: async () => snapshot,
      readDetails: vi.fn(),
      refreshRepository: async () => snapshot,
    },
    { execute },
  );
  await controller.refresh();
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(OperationsPanel, { target, props: { controller } });
  try {
    await expect
      .element(
        page.getByRole("button", {
          name: "Automation decisions 1",
          exact: true,
        }),
      )
      .toBeVisible();
    const row = page.getByRole("button", {
      name: "example/consumer Latest verified policy decision held",
      exact: true,
    });
    await expect.element(row).toHaveAttribute("aria-expanded", "false");
    await expect
      .element(page.getByText("Previous qualification failed", { exact: true }))
      .not.toBeVisible();
    await row.click();
    await expect
      .element(
        page.getByRole("heading", { name: "Previous decision", exact: true }),
      )
      .toBeVisible();
    await expect
      .element(page.getByText("Previous qualification failed", { exact: true }))
      .toBeVisible();
    expect(target.textContent).not.toContain("Obsolete poll result");
    controller.query = "Obsolete poll result";
    await expect
      .element(
        page.getByRole("button", {
          name: "Automation decisions 0",
          exact: true,
        }),
      )
      .toBeVisible();
    controller.query = "Latest verified policy decision";
    await expect
      .element(
        page.getByRole("button", {
          name: "Automation decisions 1",
          exact: true,
        }),
      )
      .toBeVisible();
    expect(execute).not.toHaveBeenCalled();
  } finally {
    controller.dispose();
    await unmount(app);
    target.remove();
  }
});
