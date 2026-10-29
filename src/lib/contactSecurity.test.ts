import { describe, expect, it } from "vitest";
import {
  ContactRateLimiter,
  ContactRequestError,
  readContactForm,
} from "./contactSecurity";

describe("contact request bounds", () => {
  it("rejects oversized bodies with or without a truthful Content-Length", async () => {
    for (const length of [undefined, "1", "70000"]) {
      const headers = new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
      });
      if (length) headers.set("Content-Length", length);
      const request = new Request("https://ezcsv.com/api/contact", {
        method: "POST",
        headers,
        body: `message=${"x".repeat(70_000)}`,
      });
      await expect(readContactForm(request)).rejects.toMatchObject({
        status: 413,
      });
    }
  });

  it("accepts a maximum length Japanese message in an ordinary multipart form", async () => {
    const body = new FormData();
    body.set("name", "山田 太郎");
    body.set("message", "あ".repeat(5000));
    const result = await readContactForm(
      new Request("https://ezcsv.com/api/contact", { method: "POST", body }),
    );
    expect(result.get("message")).toBe("あ".repeat(5000));
  });

  it("rejects a malformed multipart boundary as a client error", async () => {
    await expect(
      readContactForm(
        new Request("https://ezcsv.com/api/contact", {
          method: "POST",
          headers: { "Content-Type": "multipart/form-data" },
          body: "malformed",
        }),
      ),
    ).rejects.toBeInstanceOf(ContactRequestError);
  });
});

describe("contact throttling", () => {
  it("blocks the sixth request, expires entries, and bounds distinct IPs", () => {
    const limiter = new ContactRateLimiter(1000, 5, 2);
    for (let index = 0; index < 5; index++) {
      expect(limiter.isLimited("one", 100)).toBe(false);
    }
    expect(limiter.isLimited("one", 100)).toBe(true);
    expect(limiter.isLimited("two", 100)).toBe(false);
    expect(limiter.isLimited("three", 100)).toBe(true);
    // Both old slots are released when their window expires.
    expect(limiter.isLimited("three", 1100)).toBe(false);
    expect(limiter.isLimited("four", 1100)).toBe(false);
  });
});
