import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import Demo from "./operations/OperationsDemo.svelte";
export default {
  title: "Maintenance/Operations",
  component: Demo,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fixture-only coordinator waves, issues and explicit actions. Visual review pending.",
      },
    },
  },
} satisfies Meta<typeof Demo>;
type Story = StoryObj<typeof Demo>;
export const WavesAndIssues: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("heading", {
      name: "Dependency and release operations",
    });
    await c.findByText("Expected upstream wait");
    const footer = c.getByRole("region", { name: "Batch actions" });
    const scroller = canvasElement.querySelector<HTMLElement>(
      ".operations-scroll-viewport",
    )!;
    await expect(scroller.dataset.uiComponent).toBe("scroll-area");
    const contentRight = scroller
      .querySelector(".operations-section-header")!
      .getBoundingClientRect().right;
    await expect(
      scroller.getBoundingClientRect().right - contentRight,
    ).toBeGreaterThanOrEqual(8);
    const before = footer.getBoundingClientRect();
    scroller.scrollTo({ top: scroller.scrollHeight });
    await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(0));
    await expect(footer.getBoundingClientRect().top).toBeCloseTo(before.top, 0);
    await expect(
      c.queryByText(/Only individually eligible targets/),
    ).not.toBeInTheDocument();
    const badges = [
      ...canvasElement.querySelectorAll<HTMLElement>("[data-operation-status]"),
    ];
    const waiting = badges.find(
      (b) => b.dataset.operationStatus === "waiting",
    )!;
    const failed = badges.find((b) => b.dataset.operationStatus === "failed")!;
    const held = badges.find((b) => b.dataset.operationStatus === "held")!;
    await expect(getComputedStyle(waiting).backgroundColor).not.toBe(
      getComputedStyle(failed).backgroundColor,
    );
    await expect(getComputedStyle(held).backgroundColor).not.toBe(
      getComputedStyle(failed).backgroundColor,
    );
    scroller.scrollTo({ top: 0 });

    const release = c.getByRole("button", {
      name: /@example\/foundation example\/foundation/,
    });
    await expect(release).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(release);
    const commit = await c.findAllByRole("link", {
      name: /View commit aaaaaaaa/,
    });
    await expect(commit[0]).toHaveAttribute(
      "href",
      "https://github.com/example/foundation/commit/" + "a".repeat(40),
    );
    await expect(
      canvasElement.querySelector(".operations-timeline"),
    ).not.toBeNull();
    await c.findAllByText("Manual repair ownership");
    await expect(
      c.getByText("branch reconciliation", { selector: "[data-category]" }),
    ).toBeVisible();
    await userEvent.click(
      c.getByRole("button", {
        name: /example\/repair Manual repair ownership branch reconciliation held/,
      }),
    );
    await c.findByText(
      "Review the retained branch, then merge it through a pull request or retire it.",
    );
    await expect(
      c.getByRole("link", {
        name: /lapis-dependencies\/lapis-first-party/,
      }),
    ).toHaveAttribute(
      "href",
      "https://github.com/example/repair/tree/lapis-dependencies/lapis-first-party",
    );
    await c.findByText("Compatibility decision");
    await userEvent.click(
      c.getByRole("button", { name: /Review major framework compatibility/ }),
    );
    await c.findByRole("link", {
      name: /Review major framework compatibility/,
    });
  },
};
export const ImmediatePartialBatch: Story = {
  args: { uncertain: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await c.findByRole("button", { name: "Rerun eligible failures" }),
    );
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await page.findByText(/Fixture outcome unknown/);
    await page.findByText(/Fixture rerun accepted/);
  },
};
export const MissingReport: Story = { args: { state: "unavailable" } };
export const StaleReport: Story = { args: { state: "stale" } };
export const UnsupportedReport: Story = { args: { state: "unsupported" } };
export const Dark: Story = { args: { dark: true } };
export const WorkflowBatch: Story = {
  args: { action: "approve-run" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await c.findByRole("button", { name: "Approve eligible workflows" }),
    );
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await page.findAllByText(/Fixture rerun accepted/);
  },
};
export const EnvironmentBatch: Story = {
  args: { action: "approve-deployment" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await c.findByRole("button", { name: "Approve eligible environments" }),
    );
    await expect(page.queryByRole("dialog")).not.toBeInTheDocument();
    await page.findAllByText(/Fixture rerun accepted/);
  },
};

export const AttentionSummary: Story = {
  args: { part: "attention" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByText("Automation attention");
    await expect(
      c.queryByRole("button", {
        name: "Toggle automation attention",
      }),
    ).not.toBeInTheDocument();
    await expect(
      c.queryByText("Manual repair ownership"),
    ).not.toBeInTheDocument();
    await expect(
      c.queryByText(/Synthetic coordinator evidence/),
    ).not.toBeInTheDocument();
    await expect(
      c.getByRole("button", { name: "View waves, issues and decisions" }),
    ).toBeVisible();
    await expect(canvasElement.querySelector("[aria-expanded]")).toBeNull();
  },
};
export const Workspace: Story = {
  args: { shell: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("heading", {
      name: "Dependency and release operations",
    });
    const toolbar = canvasElement.querySelector(
      ".ui-minimal-app-shell__toolbar",
    )!;
    const scroll = canvasElement.querySelector(".operations-scroll-viewport")!;
    await expect(scroll.getBoundingClientRect().top).toBeCloseTo(
      toolbar.getBoundingClientRect().bottom,
      0,
    );
    await expect(
      c.getByRole("img", { name: "4 items need attention" }),
    ).toBeVisible();
  },
};
export const Narrow: Story = {
  args: { width: 390 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const footer = within(
      await c.findByRole("region", { name: "Batch actions" }),
    );
    const buttons = footer.getAllByRole("button"),
      bounds = buttons.map((b) => b.getBoundingClientRect());
    await expect(buttons).toHaveLength(3);
    const labels = buttons.map(
      (b) => b.querySelector<HTMLElement>(".operations-action-label")!,
    );
    await expect(
      labels.some((label) => label.scrollWidth > label.clientWidth),
    ).toBe(true);
    for (const rect of bounds)
      await expect(rect.top).toBeCloseTo(bounds[0]!.top, 0);
    await expect(bounds.at(-1)!.right).toBeLessThanOrEqual(
      canvasElement.querySelector(".operations-footer")!.getBoundingClientRect()
        .right,
    );
    await expect(
      footer.getByRole("button", { name: "Approve eligible environments" }),
    ).toHaveAttribute("title", "Approve eligible environments");
  },
};

export const StickySections: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByText("Expected upstream wait");
    const scroller = canvasElement.querySelector<HTMLElement>(
      ".operations-scroll-viewport",
    )!;
    await userEvent.click(
      c.getByRole("button", {
        name: /example\/consumer Expected upstream wait/,
      }),
    );
    const heading = c.getByRole("heading", {
      name: /^Downstream progress and attention/,
    });
    const header = heading.closest("header")!;
    await expect(header).not.toBeNull();
    await expect(getComputedStyle(header).position).toBe("sticky");
    scroller.scrollTo({
      top:
        scroller.scrollTop +
        header.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        60,
    });
    await waitFor(() =>
      expect(header.getBoundingClientRect().top).toBeCloseTo(
        scroller.getBoundingClientRect().top,
        0,
      ),
    );
    await userEvent.click(
      c.getByRole("button", {
        name: /example\/compatibility Compatibility decision/,
      }),
    );
    const link = c.getAllByRole("link", { name: "example/compatibility" })[0]!;
    await userEvent.hover(link);
    await expect(getComputedStyle(link).textDecorationLine).toBe("none");
  },
};

export const Footer: Story = { args: { part: "footer" } };

export const RowAlignment: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByText("Expected upstream wait");
    const group = c.getByRole("region", { name: "Coverage gaps" });
    const parentIcon = group
      .querySelector("header svg")!
      .getBoundingClientRect();
    const childIcon = group
      .querySelector(".operations-row-icon")!
      .getBoundingClientRect();
    await expect(parentIcon.left + parentIcon.width / 2).toBeCloseTo(
      childIcon.left + childIcon.width / 2,
      0,
    );
    await userEvent.click(
      c.getByRole("button", { name: /^Verified publications/ }),
    );
    const empty = c.getByText("No verified publications in this report.");
    const range = document.createRange();
    range.selectNodeContents(empty);
    const title = group
      .querySelector(".operations-row-copy strong")!
      .getBoundingClientRect();
    await expect(range.getBoundingClientRect().left).toBeCloseTo(title.left, 0);
  },
};

export const SectionDisclosure: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const empty = await c.findByRole("button", {
      name: /^Verified publications/,
    });
    await expect(empty).toHaveAttribute("aria-expanded", "false");
    await expect(
      c.queryByText("No verified publications in this report."),
    ).not.toBeVisible();
    await userEvent.click(empty);
    await c.findByText("No verified publications in this report.");
    const populated = c.getByRole("button", {
      name: /^Downstream progress and attention/,
    });
    await expect(populated).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(populated);
    await waitFor(() =>
      expect(c.queryByText("Expected upstream wait")).not.toBeVisible(),
    );
  },
};

export const FoldAll: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(
      await c.findByRole("button", { name: "Fold all operations" }),
    );
    await waitFor(() =>
      expect(c.queryByText("Expected upstream wait")).not.toBeVisible(),
    );
    await userEvent.click(
      c.getByRole("button", { name: "Expand all operations" }),
    );
    await c.findAllByRole("button", { name: /Copy operation ID / });
    await expect(
      c.getByRole("button", { name: /^Verified publications/ }),
    ).toHaveAttribute("aria-expanded", "true");
  },
};

export const IdentifierPairs: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(
      await c.findByRole("button", { name: "Fold all operations" }),
    );
    await userEvent.click(
      c.getByRole("button", { name: "Expand all operations" }),
    );
    const pairs = await c.findAllByRole("group", {
      name: /^Identifiers$/,
    });
    await expect(pairs.length).toBeGreaterThanOrEqual(3);
    for (const pair of pairs) {
      const buttons = within(pair).getAllByRole("button");
      await expect(buttons).toHaveLength(2);
      await expect(buttons[0].textContent).toMatch(/Operation|Report/);
      await expect(buttons[1]).toHaveTextContent("Policy");
      await expect(buttons[0].getBoundingClientRect().right).toBeCloseTo(
        buttons[1].getBoundingClientRect().left,
        0,
      );
    }
  },
};

export const RefreshErrorToast: Story = {
  args: {
    shell: true,
    refreshError:
      "Workflow CI: GitHub data unavailable (HTTP 422). " +
      "Additional diagnostic detail. ".repeat(20),
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const notifications = within(
      await page.findByRole("region", { name: "Notifications" }),
    );
    await expect(
      await notifications.findByText("Could not refresh example/consumer"),
    ).toBeVisible();
    await expect(
      within(
        c.getByRole("region", { name: "Maintenance operations" }),
      ).queryByText(/Workflow CI: GitHub data unavailable/),
    ).not.toBeInTheDocument();
    await userEvent.click(
      notifications.getByRole("button", { name: "View details" }),
    );
    const log = within(await page.findByRole("region", { name: "Status log" }));
    await waitFor(() =>
      expect(
        log.getByText(/Workflow CI: GitHub data unavailable/),
      ).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await userEvent.click(c.getByRole("button", { name: /^Refresh$/ }));
    await expect(
      notifications.queryByText("Could not refresh example/consumer"),
    ).not.toBeInTheDocument();
  },
};
export const DarkNarrowToast: Story = {
  args: {
    shell: true,
    dark: true,
    width: 390,
    refreshError: "Workflow CI: GitHub data unavailable (HTTP 422).",
  },
};
