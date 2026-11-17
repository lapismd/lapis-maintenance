import { expect, it } from "vitest";
import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import ReviewDemo from "../../catalog/review/ReviewDemo.svelte";
import ComponentDemo from "../../catalog/ComponentDemo.svelte";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";

it("shows a themed draft chip with an icon in the inspector", async () => {
  const target = document.createElement("div");
  document.body.append(target);
  const app = mount(ReviewDemo, {
    target,
    props: { selected: "compatibility", workspace: false },
  });
  try {
    const chip = page.getByText("Draft", { exact: true });
    await expect.element(chip).toBeVisible();
    expect(chip.element().getAttribute("data-review-status")).toBe("draft");
    expect(chip.element().querySelector("svg")).not.toBeNull();
    expect(getComputedStyle(chip.element()).backgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
  } finally {
    await unmount(app);
    target.remove();
  }
});

it("gives the app commit link a real browser hover background", async () => {
  const target = document.createElement("div");
  document.body.append(target);
  const app = mount(ComponentDemo, { target, props: { part: "navigation" } });
  try {
    const link = page.getByRole("link", { name: /^App version / });
    await expect.element(link).toBeVisible();
    const before = getComputedStyle(link.element()).backgroundColor;
    await link.hover();
    expect(getComputedStyle(link.element()).backgroundColor).not.toBe(before);
    expect(
      parseFloat(getComputedStyle(link.element()).paddingInlineStart),
    ).toBeGreaterThan(0);
  } finally {
    await unmount(app);
    target.remove();
  }
});

it.each([390, 1022, 1600])(
  "keeps PR actions on one row and adds markdown bottom space at %i pixels",
  async (width) => {
    await page.viewport(width, 987);
    const target = document.createElement("div");
    document.body.append(target);
    const app = mount(ReviewDemo, { target });
    try {
      await expect
        .element(
          page.getByRole("heading", {
            name: "Publish approved registry updates #63",
          }),
        )
        .toBeVisible();
      const group = target.querySelector<HTMLElement>(
        ".review-workspace-title .review-pr-actions",
      )!;
      const stateChip = target.querySelector<HTMLElement>(
        '.review-main-toolbar [data-review-status="open"]',
      );
      expect(stateChip).not.toBeNull();
      expect(stateChip!.querySelector("svg")).not.toBeNull();
      const buttons = Array.from(group.querySelectorAll("button"));
      expect(buttons).toHaveLength(3);
      for (const button of buttons) {
        expect(button.getBoundingClientRect().height).toBeGreaterThan(0);
        expect(button.getBoundingClientRect().top).toBeCloseTo(
          buttons[0]!.getBoundingClientRect().top,
          0,
        );
        expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(
          target
            .querySelector(".review-workspace-heading")!
            .getBoundingClientRect().right,
        );
      }
      for (const name of ["Approve PR", "Comment", "Request changes"])
        await expect
          .element(
            page
              .getByRole("region", { name: "Pull request workspace" })
              .getByRole("button", { name, exact: true }),
          )
          .toBeVisible();
      const label = group.querySelector<HTMLElement>(".review-action-label")!;
      if (width < 1200)
        expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
      else expect(label.getBoundingClientRect().width).toBeGreaterThan(1);
      await expect
        .element(page.getByRole("region", { name: "Pull request description" }))
        .toBeVisible();
      const markdown = target.querySelector<HTMLElement>(
        '.review-description-content [data-ui-component="chat-markdown"]',
      )!;
      expect(
        parseFloat(getComputedStyle(markdown).paddingBottom),
      ).toBeGreaterThan(0);
    } finally {
      await unmount(app);
      target.remove();
      await page.viewport(1280, 900);
    }
  },
);
