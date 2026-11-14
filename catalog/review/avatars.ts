/** Local illustrations keep fixture stories independent of GitHub image requests. */
function avatar(background: string, drawing: string) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="${background}"/>${drawing}</svg>`)}`;
}
const robot =
  '<path d="M40 14v8" stroke="white" stroke-width="4"/><circle cx="40" cy="13" r="4" fill="white"/><rect x="17" y="24" width="46" height="38" rx="11" fill="white"/><rect x="24" y="32" width="32" height="18" rx="5" fill="currentColor"/><circle cx="33" cy="41" r="3" fill="white"/><circle cx="47" cy="41" r="3" fill="white"/><path d="M32 56h16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>';
export const reviewAvatars = {
  automation: avatar("#6554a8", robot),
  actions: avatar("#266a78", robot),
  maintainer: avatar(
    "#bfb0dc",
    '<path d="M14 80c0-21 12-31 26-31s26 10 26 31" fill="#493463"/><circle cx="40" cy="33" r="17" fill="#e9bc9d"/><path d="M23 32c-4-23 39-28 35 3-8-2-17-8-22-13-2 5-7 9-13 10" fill="#3a293e"/>',
  ),
};
