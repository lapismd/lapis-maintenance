<script lang="ts">
  import { FileDiff } from "@lapismd/design-core/diff";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import {
    FileCode2,
    FileImage,
    Search,
    ExternalLink,
    Files,
  } from "@lucide/svelte";
  import ReviewResource from "./ReviewResource.svelte";
  import type { ReviewController } from "../../maintenance/review/controller.svelte";
  import "./review.css";
  let { controller }: { controller: ReviewController } = $props();
  const uid = $props.id();
  let mode = $state<"unified" | "split">("unified");
  const selected = $derived(
    controller.resources.files.data?.find(
      (file) => file.path === controller.selectedPath,
    ),
  );
</script>

<div class="review-files">
  <aside class="review-file-navigation" aria-label="Changed files">
    <header>
      <div class="review-section-heading">
        <Files size={16} aria-hidden="true" />
        <h2>Files changed</h2>
        <span class="review-muted"
          >{controller.resources.files.data?.length ?? 0}</span
        >
      </div>
      <div class="review-file-search">
        <Search size={14} aria-hidden="true" /><Input
          aria-label="Search changed files"
          placeholder="Filter files…"
          bind:value={controller.fileQuery}
          style="padding-inline-start:2rem"
        />
      </div>
    </header>
    <ScrollArea.Root
      style="flex:1;min-height:0"
      viewportProps={{ "aria-label": "Changed file list" }}
    >
      <ReviewResource
        state={controller.resources.files}
        label="Files"
        onRetry={() => controller.load("files")}
      >
        <nav aria-label="Select a changed file" class="review-file-list">
          {#each controller.files as file, index (file.path)}<Button
              variant="ghost"
              class="review-file-row"
              aria-label={`View diff: ${file.path}`}
              aria-describedby={`${uid}-file-${index}`}
              aria-pressed={controller.selectedPath === file.path}
              title={file.path}
              onclick={() => controller.selectFile(file.path)}
            >
              {#if file.state === "binary"}<FileImage
                  size={15}
                  aria-hidden="true"
                />{:else}<FileCode2 size={15} aria-hidden="true" />{/if}<span
                >{file.path}<small aria-hidden="true">{file.state}</small></span
              ><small class="review-file-stats" aria-hidden="true"
                ><span class="review-additions">+{file.additions}</span><span
                  class="review-deletions">−{file.deletions}</span
                ></small
              ><span id={`${uid}-file-${index}`} hidden
                >{file.state}, {file.additions} additions, {file.deletions} deletions</span
              >
            </Button>{:else}<div class="review-file-empty">
              <p>No matching files</p>
              {#if controller.fileQuery}<Button
                  variant="outline"
                  size="sm"
                  onclick={() => (controller.fileQuery = "")}
                  >Clear file search</Button
                >{/if}
            </div>{/each}
        </nav>
      </ReviewResource>
    </ScrollArea.Root>
  </aside>
  <section class="review-file-preview" aria-label="Selected file diff">
    <header>
      <span class="review-file-path" title={selected?.path}
        >{selected?.path ?? "Select a file"}</span
      >
      <div class="review-diff-controls">
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={mode === "unified"}
          onclick={() => (mode = "unified")}>Unified</Button
        ><Button
          variant="ghost"
          size="sm"
          aria-pressed={mode === "split"}
          onclick={() => (mode = "split")}>Split</Button
        >{#if selected}<a
            class="maintenance-icon-link"
            aria-label="Open selected file on GitHub"
            href={selected.url}
            target="_blank"
            rel="noopener noreferrer"
            ><ExternalLink size={15} aria-hidden="true" /></a
          >{/if}
      </div>
    </header>
    <div class="review-diff-surface">
      <ReviewResource
        state={controller.patch}
        label="Diff"
        onRetry={() =>
          controller.selectedPath &&
          controller.selectFile(controller.selectedPath)}
      >
        {#if controller.patch.data?.patch && selected}<FileDiff
            path={selected.path}
            patch={controller.patch.data.patch}
            viewMode={mode}
          />
        {:else}<Empty.Root
            ><Empty.Header
              ><Empty.Media variant="icon"><FileCode2 /></Empty.Media
              ><Empty.Title role="heading" aria-level={3}
                >{controller.patch.data?.explanation
                  ? "Preview unavailable"
                  : "Choose a changed file"}</Empty.Title
              ><Empty.Description
                >{controller.patch.data?.explanation ??
                  "Select a file to inspect its changes for the displayed revision."}</Empty.Description
              ></Empty.Header
            >{#if selected}<Empty.Content
                ><a
                  class="review-external"
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  >View change on GitHub<ExternalLink
                    size={14}
                    aria-hidden="true"
                  /></a
                ></Empty.Content
              >{/if}</Empty.Root
          >{/if}
      </ReviewResource>
    </div>
  </section>
</div>
