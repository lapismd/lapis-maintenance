import { expect, it, vi } from "vitest";
import { GithubTransport } from "./transport";
import { MemoryResponseCache } from "../cache/response-cache";
import { GithubWriteTransport } from "./write-transport";

it.each(["read", "write"] as const)(
  "uses the native browser fetch receiver for %s without an injected transport",
  async (kind) => {
    const nativeFetch = globalThis.fetch;
    const send = vi.spyOn(globalThis, "fetch").mockImplementation(function (
      this: unknown,
      _input,
      init,
    ) {
      // Retain Chromium's native receiver check without sending a token or network request.
      return Reflect.apply(nativeFetch, this, [
        "data:application/json,%7B%22ok%22%3Atrue%7D",
        init,
      ]);
    });
    const client = new GithubTransport(
      "invented-browser-token",
      new MemoryResponseCache(),
    );
    const writer = new GithubWriteTransport("invented-browser-token");
    try {
      const result =
        kind === "read"
          ? await client.read("/user", new AbortController().signal)
          : (await writer.submit("/graphql", "POST", {})).body;
      expect(result).toEqual({
        ok: true,
      });
    } finally {
      client.dispose();
      writer.dispose();
      send.mockRestore();
    }
  },
);
