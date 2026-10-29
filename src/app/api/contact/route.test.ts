import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@aws-sdk/client-ses", () => ({
  SESClient: class {
    send = mocks.send;
  },
  SendEmailCommand: class {
    constructor(public input: unknown) {}
  },
}));

beforeEach(() => {
  vi.resetModules();
  mocks.send.mockReset().mockResolvedValue({});
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SES_FROM_EMAIL", "noreply@example.com");
  vi.stubEnv("SES_TO_EMAIL", "contact@example.com");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "test-only-secret");
  vi.stubEnv("CONTACT_AUTOREPLY_ENABLED", "false");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function contactRequest(origin = "https://ezcsv.com") {
  const body = new FormData();
  body.set("name", "Test User");
  body.set("email", "test@example.com");
  body.set("_subject", "Security regression test");
  body.set("message", "Synthetic test message");
  body.set("cf-turnstile-response", "synthetic-token");
  return new NextRequest("https://ezcsv.com/api/contact", {
    method: "POST",
    headers: { Origin: origin },
    body,
  });
}

describe("contact email safeguards", () => {
  it("rejects cross-origin submissions before making external requests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");
    expect((await POST(contactRequest("https://other.example"))).status).toBe(
      403,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects a solved challenge that belongs to another hostname", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ success: true, hostname: "other.example" }),
        ),
    );
    const { POST } = await import("./route");
    expect((await POST(contactRequest())).status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("sends an ordinary same-origin form after a matching challenge", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ success: true, hostname: "ezcsv.com" }),
        ),
    );
    const { POST } = await import("./route");
    expect((await POST(contactRequest())).status).toBe(200);
    expect(mocks.send).toHaveBeenCalledOnce();
  });

  it("rejects file values in text fields before sending any email", async () => {
    const request = contactRequest();
    const body = await request.formData();
    body.set("name", new File(["attachment"], "test.txt"));
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest(request.url, { method: "POST", body }),
    );
    expect(response.status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects a malformed form with 400 rather than an internal server error", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("https://ezcsv.com/api/contact", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: "invalid",
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
