"use client";

import Script from "next/script";
import { useState } from "react";

// 開発時のみ Turnstile テストサイトキー（本番でフォールバックするとボットにも通りやすい）
const TURNSTILE_TEST_KEY = "1x00000000000000000000AA";
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  (process.env.NODE_ENV === "development" ? TURNSTILE_TEST_KEY : "");

export function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    // 暗黙レンダリング: cf-turnstile-response はフォーム内に自動追加される

    setStatus("submitting");
    setErrorMessage("");

    // AWS SES を使用（Formspree は使用していません）
    const apiEndpoint = "/api/contact";

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
        setFormKey((k) => k + 1);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        if (res.status === 404) {
          setErrorMessage(
            "API が見つかりません。ページを再読み込みしてください。",
          );
        } else {
          setErrorMessage(
            data.error ||
              `送信に失敗しました（${res.status}）。しばらくしてからお試しください。`,
          );
        }
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        `送信に失敗しました。ネットワーク接続を確認してください。${error instanceof Error ? ` (${error.message})` : ""}`,
      );
    }
  };

  // AWS SES が未設定の場合はフォールバック表示（開発時のみ）
  if (process.env.NODE_ENV === "development" && !process.env.SES_FROM_EMAIL) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-stone-700">
          お問い合わせは運営会社の窓口より承っております。
        </p>
        <div className="mt-4">
          <a
            href="https://cybereye-tech.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            お問い合わせはこちら（運営会社サイト）
          </a>
        </div>
        <p className="mt-4 text-sm text-stone-500">
          フォームから直接送信するには、AWS SES の環境変数を設定してください。
          <br />
          <code className="mx-1 rounded bg-stone-200 px-1">SES_FROM_EMAIL</code>
          、<code className="mx-1 rounded bg-stone-200 px-1">SES_TO_EMAIL</code>
          、<code className="mx-1 rounded bg-stone-200 px-1">AWS_REGION</code>、
          <code className="mx-1 rounded bg-stone-200 px-1">
            AWS_ACCESS_KEY_ID
          </code>
          、
          <code className="mx-1 rounded bg-stone-200 px-1">
            AWS_SECRET_ACCESS_KEY
          </code>
          <br />
          ボット対策は Turnstile テストキーで動作します。本番用には
          <code className="mx-1 rounded bg-stone-200 px-1">
            NEXT_PUBLIC_TURNSTILE_SITE_KEY
          </code>{" "}
          と
          <code className="mx-1 rounded bg-stone-200 px-1">
            TURNSTILE_SECRET_KEY
          </code>{" "}
          を設定してください。
        </p>
      </div>
    );
  }

  return (
    <>
      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ハニーポット: 人間には非表示。ボットが値を入れたら API 側で送信しない */}
        <div
          className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
          aria-hidden="true"
        >
          <label htmlFor="_company_website">Website</label>
          <input
            id="_company_website"
            name="_company_website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-stone-700"
          >
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="山田 太郎"
            disabled={status === "submitting"}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-stone-700"
          >
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="example@example.com"
            disabled={status === "submitting"}
          />
        </div>

        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-stone-700"
          >
            件名 <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            name="_subject"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="ezcsvについてのご質問"
            disabled={status === "submitting"}
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-stone-700"
          >
            メッセージ <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="お問い合わせ内容をご記入ください"
            disabled={status === "submitting"}
          />
        </div>

        {status === "success" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            送信が完了しました。ありがとうございます。
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {errorMessage}
          </div>
        )}

        {TURNSTILE_SITE_KEY && (
          <div
            key={formKey}
            className="cf-turnstile"
            data-sitekey={TURNSTILE_SITE_KEY}
            data-theme="light"
            data-size="normal"
          />
        )}

        <div>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting" ? "送信中..." : "送信する"}
          </button>
        </div>
      </form>
    </>
  );
}
