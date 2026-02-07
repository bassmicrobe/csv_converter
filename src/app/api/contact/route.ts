import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { NextRequest, NextResponse } from "next/server";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL;
const TO_EMAIL = process.env.SES_TO_EMAIL;

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
      }),
    });
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
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const subject = formData.get("_subject")?.toString();
    const message = formData.get("message")?.toString();
    const turnstileToken = formData.get("cf-turnstile-response")?.toString();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "必須項目が入力されていません" },
        { status: 400 }
      );
    }

    if (turnstileToken && !(await verifyTurnstile(turnstileToken))) {
      return NextResponse.json(
        { error: "認証に失敗しました。再度お試しください。" },
        { status: 400 }
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

    // 両方のメールを送信
    await Promise.all([
      sesClient.send(adminCommand),
      sesClient.send(autoReplyCommand),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SES送信エラー:", error);
    return NextResponse.json(
      { error: "メール送信に失敗しました。しばらくしてからお試しください。" },
      { status: 500 }
    );
  }
}
