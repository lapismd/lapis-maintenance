<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Checkbox } from "@lapismd/design-core/shadcn/checkbox";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import GitHubIcon from "../maintenance/GitHubIcon.svelte";
  import logo from "../../assets/lapis-logo.svg";
  let {
    busy = false,
    restoring = false,
    error = "",
    notice = "",
    onConnect,
  }: {
    busy?: boolean;
    restoring?: boolean;
    error?: string;
    notice?: string;
    onConnect: (token: string, remember: boolean) => Promise<void>;
  } = $props();
  let token = $state("");
  let remember = $state(true);
  const id = $props.id();
</script>

<main class="maintenance-login" data-ui-theme="lapis">
  <section class="maintenance-login-card" aria-labelledby={`${id}-title`}>
    <img src={logo} alt="Lapis" width="42" height="42" />
    <h1 id={`${id}-title`}>Lapis Maintenance</h1>
    {#if restoring}<div role="status" aria-label="Restoring your session">
        <Skeleton style="height:2.5rem;width:100%" /><Skeleton
          style="height:6rem;width:100%;margin-top:1rem"
        />
      </div>
    {:else}
      <p>Connect GitHub to see what needs your attention.</p>
      <form
        onsubmit={async (event) => {
          event.preventDefault();
          const entered = token;
          token = "";
          await onConnect(entered, remember);
        }}
      >
        <label for={`${id}-token`}>GitHub token</label>
        <Input
          id={`${id}-token`}
          type="password"
          bind:value={token}
          autocomplete="off"
          autocapitalize="off"
          spellcheck={false}
          placeholder="Personal access token"
          required
          disabled={busy}
        />
        <div class="maintenance-login-remember">
          <Checkbox
            id={`${id}-remember`}
            bind:checked={remember}
            disabled={busy}
          /><label for={`${id}-remember`}>Remember token on this device</label>
        </div>
        <small
          >The remembered token is stored in this browser. Disconnect removes it
          and the active cache.</small
        >
        {#if error}<p role="alert">{error}</p>{/if}
        {#if notice}<p role="status">{notice}</p>{/if}
        <Button type="submit" disabled={busy || !token.trim()}
          ><GitHubIcon />{busy ? "Connecting…" : "Connect GitHub"}</Button
        >
      </form>
      <p class="maintenance-muted">
        Use repository read access for metadata, pull requests, checks, commit
        statuses, Actions and environments. To take actions, add Pull requests
        write, Contents write for merges and Actions write for workflows.
        Fine-grained tokens cover one resource owner.
      </p>
      <a
        href="https://github.com/settings/personal-access-tokens"
        target="_blank"
        rel="noreferrer">Manage GitHub tokens</a
      >
    {/if}
  </section>
</main>
