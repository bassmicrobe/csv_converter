import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { middleware } from "./middleware";

function request(credentials?: string) {
  return new NextRequest("https://ezcsv.com/privacy", {
    headers: credentials
      ? {
          Authorization: `Basic ${Buffer.from(credentials).toString("base64")}`,
        }
      : {},
  });
}

beforeEach(() => {
  vi.stubEnv("BASIC_AUTH_ENABLED", "true");
  vi.stubEnv("BASIC_AUTH_USER", "reviewer");
  vi.stubEnv("BASIC_AUTH_PASSWORD", "secret");
});

afterEach(() => vi.unstubAllEnvs());

describe("Basic authentication", () => {
  it("requires credentials and does not cache an authentication failure", () => {
    const response = middleware(request());
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("does not accept a password with an appended colon suffix", () => {
    expect(middleware(request("reviewer:secret:wrong")).status).toBe(401);
  });

  it("supports the complete password including colons and UTF-8 characters", () => {
    vi.stubEnv("BASIC_AUTH_PASSWORD", "秘密:パスワード");
    expect(middleware(request("reviewer:秘密:パスワード")).status).toBe(200);
  });

  it("fails closed if protection is enabled but a credential is missing", () => {
    vi.stubEnv("BASIC_AUTH_PASSWORD", "");
    expect(middleware(request()).status).toBe(503);
  });

  it("keeps explicit opt-out and unconfigured public installations working", () => {
    vi.stubEnv("BASIC_AUTH_ENABLED", "false");
    expect(middleware(request()).status).toBe(200);
    vi.stubEnv("BASIC_AUTH_ENABLED", "");
    vi.stubEnv("BASIC_AUTH_USER", "");
    vi.stubEnv("BASIC_AUTH_PASSWORD", "");
    expect(middleware(request()).status).toBe(200);
  });
});
