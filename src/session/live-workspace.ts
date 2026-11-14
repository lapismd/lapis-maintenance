import { ReviewController } from "../maintenance/review/controller.svelte";
import { ActivityController } from "../maintenance/activity/controller.svelte";
import { GithubReviewPort } from "../github/review-port";
import { GithubReviewCommands } from "../github/review-commands";
import { GithubActivityPort } from "../github/activity-port";
import { overviewOf } from "../github/review-mapping";
import type { GithubTransport } from "../github/transport";
import type { GithubReadPort } from "../github/read-port";
import type { GithubCommandPort } from "../github/command-port";
import { DispatchReads } from "../github/dispatch-reads";
import { DispatchController } from "../maintenance/dispatch/controller.svelte";
import type { MaintenanceController } from "../maintenance/controller.svelte";
import type { ResponseCache } from "../cache/response-cache";
export class LiveWorkspace {
  readonly dispatch: DispatchController;
  readonly review: ReviewController;
  readonly activity: ActivityController;
  readonly resources: GithubReviewPort;
  readonly events: GithubActivityPort;
  constructor(
    client: GithubTransport,
    reader: GithubReadPort,
    commands: GithubCommandPort,
    inbox: MaintenanceController,
    cache: ResponseCache,
    actor: string,
    selection: () => string,
  ) {
    const dispatch = new DispatchReads(client);
    commands.dispatch = dispatch;
    this.dispatch = new DispatchController({
      discover: (repo, signal) => dispatch.discover(repo, signal),
      target: (repo, workflow, ref, signal) =>
        dispatch.target(repo, workflow, ref, signal),
      execute: (command, signal) => commands.execute(command, signal),
    });
    this.resources = new GithubReviewPort(
      client,
      reader,
      actor,
      selection,
      cache,
    );
    this.events = new GithubActivityPort(client, () => inbox.snapshot, cache);
    this.activity = new ActivityController(this.events);
    this.review = new ReviewController(
      () =>
        (inbox.snapshot?.items ?? []).map((item) =>
          overviewOf(
            reader.seed(item.id) ?? { item, description: "", checks: [] },
          ),
        ),
      this.resources,
      new GithubReviewCommands(reader, this.resources, commands, inbox),
    );
  }
  dispose() {
    this.dispatch.dispose();
    this.review.dispose();
    this.activity.dispose();
    this.resources.dispose();
    this.events.dispose();
  }
  async drain() {
    await Promise.allSettled([this.resources.drain(), this.events.drain()]);
  }
}
