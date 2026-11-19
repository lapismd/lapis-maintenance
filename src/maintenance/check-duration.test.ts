import { describe, expect, it } from "vitest";
import {
  checkDurationMilliseconds,
  formatCheckDuration,
} from "./check-duration";

describe("check duration", () => {
  it("formats running and completed durations", () => {
    const start = "2026-11-19T10:00:00.000Z";
    expect(
      checkDurationMilliseconds(start, undefined, Date.parse(start) + 12_000),
    ).toBe(12_000);
    expect(checkDurationMilliseconds(start, "2026-11-19T10:03:24.000Z")).toBe(
      204_000,
    );
    expect(formatCheckDuration(12_000)).toBe("12s");
    expect(formatCheckDuration(204_000)).toBe("3m 24s");
    expect(formatCheckDuration(4_080_000)).toBe("1h 08m");
  });

  it("omits invalid, missing and reversed timestamps", () => {
    expect(checkDurationMilliseconds(undefined, undefined)).toBeUndefined();
    expect(checkDurationMilliseconds("invalid", undefined)).toBeUndefined();
    expect(
      checkDurationMilliseconds(
        "2026-11-19T10:00:01.000Z",
        "2026-11-19T10:00:00.000Z",
      ),
    ).toBeUndefined();
  });
});
