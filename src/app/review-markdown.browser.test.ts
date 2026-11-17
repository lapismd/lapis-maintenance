import { expect, it } from "vitest";
import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import ReviewWorkspace from "../components/maintenance-review/ReviewWorkspace.svelte";
import { ReviewController } from "../maintenance/review/controller.svelte";
import { MemoryReviewPort } from "../../catalog/review/memory-port";
import "@lapismd/design-core/styles.css";
import "@lapismd/repository-ui/styles.css";
import "../styles/global.css";
import "../components/maintenance-review/workspace.css";

it.each([1800, 480])(
  "renders PR Markdown at the content edge without centering or page overflow at %ipx",
  async (width) => {
    await page.viewport(width, 1000);
    const port = new MemoryReviewPort("markdown-body", 0);
    const controller = new ReviewController(port.summaries, port, port);
    const target = document.createElement("div");
    target.className = "maintenance-app review-ui";
    target.dataset.uiTheme = "lapis";
    document.body.appendChild(target);
    await controller.select("registry");
    const app = mount(ReviewWorkspace, { target, props: { controller } });
    try {
      await expect
        .element(
          page.getByRole("heading", { name: "Package publication context" }),
        )
        .toBeVisible();
      const content = target.querySelector<HTMLElement>(
        ".review-description-content",
      )!;
      const markdown = content.querySelector<HTMLElement>(
        '[data-ui-component="chat-markdown"]',
      )!;
      const heading = markdown.querySelector("h3")!.getBoundingClientRect();
      const box = content.getBoundingClientRect();
      const styles = getComputedStyle(content);
      const left = box.left + parseFloat(styles.paddingLeft);
      const right = box.right - parseFloat(styles.paddingRight);
      expect(heading.left).toBeCloseTo(left, 0);
      expect(heading.right).toBeCloseTo(right, 0);
      expect(markdown.dataset.fullWidth).toBe("true");
      expect(target.scrollWidth).toBeLessThanOrEqual(target.clientWidth + 1);
      const region = content.querySelector<HTMLElement>(
        '[aria-label="Pull request description"]',
      )!;
      expect(region.dataset.uiComponent).toBe("scroll-area");
      expect(content.textContent).not.toContain("preview-profile-context");
      expect(content.querySelector("script")).toBeNull();
      expect(content.querySelector('a[href^="javascript:"]')).toBeNull();
      expect(content.querySelectorAll("table tbody tr")).toHaveLength(3);
      expect(port.commands).toHaveLength(0);
    } finally {
      controller.dispose();
      await unmount(app);
      target.remove();
      await page.viewport(1280, 900);
    }
  },
);
