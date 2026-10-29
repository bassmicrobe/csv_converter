const MAX_BODY_BYTES = 64 * 1024;

export class ContactRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ContactRequestError";
  }
}

// Bound the stream itself: Content-Length is optional and cannot be trusted.
export async function readContactForm(request: Request): Promise<FormData> {
  const contentType = request.headers.get("content-type") ?? "";
  const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
  if (
    mediaType !== "multipart/form-data" &&
    mediaType !== "application/x-www-form-urlencoded"
  ) {
    throw new ContactRequestError("フォーム形式で送信してください", 415);
  }

  const length = request.headers.get("content-length");
  if (
    length !== null &&
    (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)
  ) {
    throw new ContactRequestError("送信データが大きすぎます", 413);
  }

  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.byteLength;
        if (bytesRead > MAX_BODY_BYTES) {
          await reader.cancel();
          throw new ContactRequestError("送信データが大きすぎます", 413);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }

  const body = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return await new Response(body, {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch {
    throw new ContactRequestError(
      "フォームデータの形式が正しくありません",
      400,
    );
  }
}

export function contactText(form: FormData, name: string): string {
  const value = form.get(name);
  if (value !== null && typeof value !== "string") {
    throw new ContactRequestError("添付ファイルは送信できません", 400);
  }
  return value?.trim() ?? "";
}

export class ContactRateLimiter {
  private readonly entries = new Map<
    string,
    { count: number; resetAt: number }
  >();
  private nextCleanup = 0;

  constructor(
    private readonly windowMs = 60_000,
    private readonly maxRequests = 5,
    private readonly maxEntries = 10_000,
  ) {}

  isLimited(ip: string, now = Date.now()): boolean {
    if (now >= this.nextCleanup) {
      for (const [key, entry] of this.entries) {
        if (now >= entry.resetAt) this.entries.delete(key);
      }
      this.nextCleanup = now + this.windowMs;
    }
    const entry = this.entries.get(ip);
    if (!entry || now >= entry.resetAt) {
      // Fail closed when flooded with distinct addresses, without growing memory.
      if (!entry && this.entries.size >= this.maxEntries) return true;
      this.entries.set(ip, { count: 1, resetAt: now + this.windowMs });
      return false;
    }
    if (entry.count >= this.maxRequests) return true;
    entry.count++;
    return false;
  }
}
