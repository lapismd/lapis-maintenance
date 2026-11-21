import type { DeviceStore } from "./device-store";
import type { openResponseCache } from "../cache/browser-cache";
export interface SessionDependencies {
  store: DeviceStore;
  openCache?: typeof openResponseCache;
  send?: typeof fetch;
}
export type OpenedSessionCache = Awaited<ReturnType<typeof openResponseCache>>;
