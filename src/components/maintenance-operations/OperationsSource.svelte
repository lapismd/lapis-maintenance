<script lang="ts">
  import "./operations-content.css";
  import { GitCommitHorizontal, FolderGit2 } from "@lucide/svelte";
  let { repository, sha }: { repository: string; sha?: string } = $props();
</script>

<span class="operations-source">
  <a
    href={`https://github.com/${repository}`}
    target="_blank"
    rel="noopener noreferrer"
    ><FolderGit2 size={13} aria-hidden="true" />{repository}</a
  >
  {#if sha}<a
      href={`https://github.com/${repository}/commit/${sha}`}
      aria-label={`View commit ${sha.slice(0, 8)} in ${repository}`}
      title={sha}
      target="_blank"
      rel="noopener noreferrer"
      ><GitCommitHorizontal size={13} aria-hidden="true" /><code
        >{sha.slice(0, 8)}</code
      ></a
    >{/if}
</span>
