import type { PersonalProfile } from "@lapismd/repository-ui/settings";
import type { GithubUser } from "../github/models";

export function savedIdentity(value: unknown): GithubUser | null {
  if (!value || typeof value !== "object") return null;
  const user = value as Partial<GithubUser>;
  if (
    !Number.isSafeInteger(user.id) ||
    user.id! <= 0 ||
    typeof user.login !== "string" ||
    !/^[\w-]{1,100}$/.test(user.login)
  )
    return null;
  return {
    id: user.id!,
    login: user.login,
    name: typeof user.name === "string" ? user.name.slice(0, 200) : null,
    avatar_url:
      typeof user.avatar_url === "string" &&
      /^https:\/\/avatars\.githubusercontent\.com\//.test(user.avatar_url)
        ? user.avatar_url
        : "",
    html_url: `https://github.com/${user.login}`,
  };
}
export async function sessionPartition(user: GithubUser, token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`lapis-maintenance:v1:${user.id}:${token}`),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
export function personalProfile(user: GithubUser): PersonalProfile {
  return {
    principal: user.login,
    revision: user.id,
    avatarUrl: /^https:\/\/avatars\.githubusercontent\.com\//.test(
      user.avatar_url,
    )
      ? user.avatar_url
      : undefined,
    details: {
      display_name: user.name || user.login,
      description: `GitHub @${user.login}`,
      avatar: null,
      email: null,
      gravatar: false,
    },
  };
}
