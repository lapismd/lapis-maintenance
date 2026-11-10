<script lang="ts">
  import {
    RepositoryProfileMenu,
    type PersonalProfile,
  } from "@lapismd/repository-ui/settings";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { LogIn, Sun, Moon } from "@lucide/svelte";
  import type { MaintenanceController } from "../../maintenance/controller.svelte";
  let {
    controller,
    profile,
    compact,
    dark,
    onToggleTheme,
    onConnect,
    sessionMode = "demo",
    onDisconnect,
  }: {
    controller: MaintenanceController;
    profile: PersonalProfile;
    compact: boolean;
    dark: boolean;
    onToggleTheme: () => void;
    onConnect: () => void;
    sessionMode?: "demo" | "github";
    onDisconnect?: () => void;
  } = $props();
  let mode = $state<"profile" | "connection" | null>(null);
</script>

<div class="maintenance-profile-footer">
  {#if controller.connected}
    <RepositoryProfileMenu
      {profile}
      avatarUrl={profile.avatarUrl ?? ""}
      {compact}
      onProfile={() => (mode = "profile")}
      onSettings={() => (mode = "connection")}
    />
  {:else}
    <Button
      variant="ghost"
      class="maintenance-sign-in"
      aria-label="Sign in with GitHub"
      title="Sign in with GitHub"
      onclick={() => (mode = "connection")}
      ><LogIn size={18} aria-hidden="true" />{#if !compact}Sign in with GitHub{/if}</Button
    >
  {/if}
</div>
<Dialog.Root
  open={mode !== null}
  onOpenChange={(open) => {
    if (!open) mode = null;
  }}
>
  <Dialog.Content>
    <Dialog.Header
      ><Dialog.Title
        >{mode === "profile" ? "Profile" : "GitHub connection"}</Dialog.Title
      ><Dialog.Description
        >{sessionMode === "demo"
          ? "This Storybook session simulates sign-in. No real token is used."
          : `Connected to GitHub as @${profile.principal}. Disconnect removes this device's token and cached repository data.`}</Dialog.Description
      ></Dialog.Header
    >
    <dl class="maintenance-facts">
      <div>
        <dt>Name</dt>
        <dd>{profile.details.display_name}</dd>
      </div>
      <div>
        <dt>Session</dt>
        <dd>
          {controller.connected
            ? sessionMode === "demo"
              ? "Connected demo"
              : "GitHub · actions follow token permissions"
            : "Disconnected"}
        </dd>
      </div>
    </dl>
    <Button variant="outline" onclick={onToggleTheme}
      >{#if dark}<Sun size={16} aria-hidden="true" />{:else}<Moon
          size={16}
          aria-hidden="true"
        />{/if}{dark ? "Use light theme" : "Use dark theme"}</Button
    >
    <Dialog.Footer>
      <Button variant="ghost" onclick={() => (mode = null)}>Close</Button>
      {#if controller.connected}<Button
          disabled={controller.commands.busy}
          variant="outline"
          onclick={() => {
            if (onDisconnect) onDisconnect();
            else controller.disconnect();
            mode = null;
          }}
          >{sessionMode === "demo"
            ? "Disconnect demo session"
            : "Disconnect GitHub"}</Button
        >
      {:else}<Button
          onclick={() => {
            onConnect();
            mode = null;
          }}>Connect demo session</Button
        >{/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
