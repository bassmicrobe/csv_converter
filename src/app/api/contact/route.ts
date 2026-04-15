import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { type NextRequest, NextResponse } from "next/server";

// --- シンプルなインメモリ レート制限 ---
// ※ 複数インスタンス環境（Vercel 本番）では Upstash Redis への移行を推奨
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分
const RATE_LIMIT_MAX = 5; // 1分あたり最大5回

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  entry.count++;
  return false;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT_LIMITS = {
  name: 100,
  email: 254,
  subject: 200,
  message: 5000,
} as const;

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL;
const TO_EMAIL = process.env.SES_TO_EMAIL;

const isProduction = process.env.NODE_ENV === "production";

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return !isProduction;
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          response: token,
        }),
      },
    );
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!FROM_EMAIL || !TO_EMAIL) {
    return NextResponse.json(
      { error: "メール送信が設定されていません" },
      { status: 500 },
    );
  }

  // レート制限チェック
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてからお試しください。" },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();

    // ハニーポット（ボットが埋めがち）。値があれば送信せず成功を装う
    const trap = formData.get("_company_website")?.toString()?.trim();
    if (trap) {
      return NextResponse.json({ success: true });
    }

    const name = formData.get("name")?.toString()?.trim();
    const email = formData.get("email")?.toString()?.trim();
    const subject = formData.get("_subject")?.toString()?.trim();
    const message = formData.get("message")?.toString()?.trim();
    const turnstileToken = formData
      .get("cf-turnstile-response")
      ?.toString()
      ?.trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "必須項目が入力されていません" },
        { status: 400 },
      );
    }

    // 入力最大長チェック
    if (
      name.length > INPUT_LIMITS.name ||
      email.length > INPUT_LIMITS.email ||
      subject.length > INPUT_LIMITS.subject ||
      message.length > INPUT_LIMITS.message
    ) {
      return NextResponse.json(
        { error: "入力値が長すぎます" },
        { status: 400 },
      );
    }

    // メールアドレス形式チェック
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "メールアドレスの形式が正しくありません" },
        { status: 400 },
      );
    }

    if (isProduction) {
      if (!process.env.TURNSTILE_SECRET_KEY) {
        return NextResponse.json(
          { error: "サーバー設定が不完全です。管理者にお問い合わせください。" },
          { status: 503 },
        );
      }
      if (!turnstileToken) {
        return NextResponse.json(
          {
            error:
              "認証を完了してください。ページを再読み込みしてからお試しください。",
          },
          { status: 400 },
        );
      }
      if (!(await verifyTurnstile(turnstileToken))) {
        return NextResponse.json(
          { error: "認証に失敗しました。再度お試しください。" },
          { status: 400 },
        );
      }
    } else if (turnstileToken && !(await verifyTurnstile(turnstileToken))) {
      return NextResponse.json(
        { error: "認証に失敗しました。再度お試しください。" },
        { status: 400 },
      );
    }

    const emailBody = `
お名前: ${name}
メールアドレス: ${email}
件名: ${subject}

メッセージ:
${message}
`;

    // 管理側への通知メール
    const adminCommand = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [TO_EMAIL],
      },
      Message: {
        Subject: {
          Data: `[ezcsv] ${subject}`,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: emailBody,
            Charset: "UTF-8",
          },
        },
      },
      ReplyToAddresses: [email],
    });

    // お問い合わせ者への自動返信メール
    const autoReplyBody = `
${name} 様

この度は、ezcsv にお問い合わせいただき、誠にありがとうございます。

以下の内容でお問い合わせを受け付けました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
件名: ${subject}

${message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

内容を確認の上、後日ご連絡させていただきます。
しばらくお待ちください。

なお、このメールは自動送信されています。
本メールに返信されても対応できませんのでご了承ください。

ezcsv 運営チーム
`;

    const autoReplyEnabled =
      process.env.CONTACT_AUTOREPLY_ENABLED !== "false" &&
      process.env.CONTACT_AUTOREPLY_ENABLED !== "0";

    if (autoReplyEnabled) {
      const autoReplyCommand = new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: `[ezcsv] お問い合わせを受け付けました`,
            Charset: "UTF-8",
          },
          Body: {
            Text: {
              Data: autoReplyBody,
              Charset: "UTF-8",
            },
          },
        },
      });
      await Promise.all([
        sesClient.send(adminCommand),
        sesClient.send(autoReplyCommand),
      ]);
    } else {
      await sesClient.send(adminCommand);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "SES送信エラー:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "メール送信に失敗しました。しばらくしてからお試しください。" },
      { status: 500 },
    );
  }
}
