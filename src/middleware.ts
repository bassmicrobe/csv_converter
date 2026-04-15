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

  // USER と PASSWORD が未設定の場合は認証をスキップ
  if (!user || !pass) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="ezcsv", charset="UTF-8"',
      },
    });
  }

  try {
    const base64 = authHeader.slice(6);
    const decoded = atob(base64);
    const [authUser, authPass] = decoded.split(":", 2);

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
