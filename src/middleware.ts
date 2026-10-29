import { type NextRequest, NextResponse } from "next/server";

// タイミング攻撃対策: XOR ベース定数時間比較（Edge Runtime 対応）
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

export function middleware(request: NextRequest) {
  const enabled = process.env.BASIC_AUTH_ENABLED;
  if (enabled === "false" || enabled === "0") {
    return NextResponse.next();
  }

  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;

  // Explicitly enabling protection must never silently expose a misconfigured site.
  if (!user || !pass) {
    if (enabled === "true" || enabled === "1" || user || pass) {
      return new NextResponse("Authentication is not configured", {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !/^Basic\s/i.test(authHeader)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="ezcsv", charset="UTF-8"',
        "Cache-Control": "private, no-store",
      },
    });
  }

  try {
    const base64 = authHeader.replace(/^Basic\s+/i, "");
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)),
    );
    const separator = decoded.indexOf(":");
    const authUser = separator < 0 ? "" : decoded.slice(0, separator);
    const authPass = separator < 0 ? "" : decoded.slice(separator + 1);

    if (
      timingSafeEqual(authUser ?? "", user) &&
      timingSafeEqual(authPass ?? "", pass)
    ) {
      return NextResponse.next();
    }
  } catch {
    // デコード失敗時
  }

  return new NextResponse("Invalid credentials", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="ezcsv", charset="UTF-8"',
      "Cache-Control": "private, no-store",
    },
  });
}

export const config = {
  matcher: [
    /*
     * すべてのパスを対象（静的ファイル・API・_next を含む）
     * _next/static と _next/image は除外すると静的アセットが未認証で読める
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
