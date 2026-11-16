import { expect, it, vi } from "vitest";
import {
  bindWorkspaceNavigation,
  writeWorkspaceHash,
} from "./workspace-navigation";
import { ReviewController } from "../maintenance/review/controller.svelte";
import { MaintenanceController } from "../maintenance/controller.svelte";
import { MemoryMaintenancePort } from "../../catalog/memory-port";
import { MemoryReviewPort } from "../../catalog/review/memory-port";
it("routes a PR/tab and restores board filters through browser Back", async () => {
  history.replaceState(null, "", "#inbox");
  const port = new MemoryMaintenancePort("populated", 0),
    inbox = new MaintenanceController(port, port),
    reviews = new MemoryReviewPort("ready", 0);
  const review = new ReviewController(reviews.summaries, reviews, reviews),
    unbind = bindWorkspaceNavigation(inbox, review);
  try {
    inbox.repositories = ["lapismd/plugin-registry"];
    inbox.statuses = ["review-needed"];
    inbox.repositoryStatuses = ["failed", "pending"];
    inbox.query = "publish";
    writeWorkspaceHash(inbox, review);
    await vi.waitFor(() => expect(location.hash).toContain("repositories="));
    // Routing identities use provider PR IDs; this fixture keeps its local item identity.
    reviews.summaries[0]!.id = "pr:lapismd/plugin-registry:63";
    const data = reviews.data.get("registry")!;
    data.overview.id = reviews.summaries[0]!.id;
    reviews.data.set(data.overview.id, data);
    await review.select(data.overview.id);
    review.workspaceOpen = true;
    review.setTab("checks");
    writeWorkspaceHash(inbox, review);
    await vi.waitFor(() =>
      expect(location.hash).toContain(
        "#pr/lapismd%2Fplugin-registry/63/checks",
      ),
    );
    await new Promise<void>((resolve) => {
      window.addEventListener("hashchange", () => resolve(), { once: true });
      history.back();
    });
    await vi.waitFor(() => expect(review.workspaceOpen).toBe(false));
    expect(inbox.repositories).toEqual(["lapismd/plugin-registry"]);
    expect(inbox.query).toBe("publish");
    expect(inbox.statuses).toEqual(["review-needed"]);
    expect(inbox.repositoryStatuses).toEqual(["failed", "pending"]);
  } finally {
    unbind();
    inbox.dispose();
    review.dispose();
    history.replaceState(null, "", "#inbox");
  }
});
