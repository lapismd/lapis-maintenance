const sha = import.meta.env.VITE_APP_COMMIT as string | undefined;
export const appBuild =
  sha && /^[a-f0-9]{40}$/.test(sha)
    ? {
        sha,
        label: `v${sha.slice(0, 8)}`,
        url: `https://github.com/lapismd/lapis-maintenance/commit/${sha}`,
      }
    : null;
