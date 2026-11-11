<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { WifiOff } from "@lucide/svelte";
  import logo from "../../assets/lapis-logo.svg";
  let { onReconnect = () => {} }: { onReconnect?: () => void } = $props();
</script>

<main class="maintenance-login" data-ui-theme="lapis">
  <section class="maintenance-login-card" aria-labelledby="offline-title">
    <img src={logo} alt="Lapis" width="42" height="42" />
    <h1 id="offline-title">Lapis Maintenance</h1>
    <WifiOff aria-hidden="true" />
    <h2>You’re offline</h2>
    <p>
      Reconnect to GitHub when you’re online. Repository data and actions
      require a connection.
    </p>
    <Button onclick={onReconnect}>Reconnect</Button>
  </section>
</main>
