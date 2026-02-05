"use client";

import Script from "next/script";
import { useRef, useState, useEffect } from "react";

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID
  ? `https://formspree.io/f/${process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID}`
  : null;

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          callback?: (token: string) => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
      ready: (callback: () => void) => void;
    };
  }
}

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(!TURNSTILE_SITE_KEY);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scriptReady || !TURNSTILE_SITE_KEY) return;
    const t = window.turnstile;
    if (!t) return;

    const container = document.getElementById("turnstile-container");
    if (!container) return;

    try {
      t.ready(() => {
        try {
          turnstileWidgetId.current = t.render("#turnstile-container", {
            sitekey: TURNSTILE_SITE_KEY,
            theme: "light",
            size: "normal",
            callback: () => setTurnstileReady(true),
          });
        } catch {
          setTurnstileReady(true);
        }
      });
    } catch {
      setTurnstileReady(true);
    }
    return () => {
      turnstileWidgetId.current = null;
    };
  }, [scriptReady]);

  const resetTurnstile = () => {
    if (typeof window !== "undefined" && window.turnstile && turnstileWidgetId.current) {
      window.turnstile.reset(turnstileWidgetId.current);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!FORMSPREE_ENDPOINT) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Turnstile トークンを FormData に含める
    if (TURNSTILE_SITE_KEY && window.turnstile && turnstileWidgetId.current) {
      const token = window.turnstile.getResponse(turnstileWidgetId.current);
      if (token) formData.set("cf-turnstile-response", token);
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
        setTurnstileReady(false);
        resetTurnstile();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(data.error || "送信に失敗しました。しばらくしてからお試しください。");
        setTurnstileReady(false);
        resetTurnstile();
      }
    } catch {
      setStatus("error");
      setErrorMessage("送信に失敗しました。ネットワーク接続を確認してください。");
      setTurnstileReady(false);
      resetTurnstile();
    }
  };

  // Formspree が未設定の場合はフォールバック表示
  if (!FORMSPREE_ENDPOINT) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-stone-700">
          お問い合わせは運営会社の窓口より承っております。
        </p>
        <div className="mt-4">
          <a
            href="https://www.cybereye-tech.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            お問い合わせはこちら（運営会社サイト）
          </a>
        </div>
        <p className="mt-4 text-sm text-stone-500">
          フォームから直接送信するには、環境変数
          <code className="mx-1 rounded bg-stone-200 px-1">NEXT_PUBLIC_FORMSPREE_FORM_ID</code>
          を設定してください（
          <a
            href="https://formspree.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:underline"
          >
            Formspree
          </a>
          で無料登録後、フォームIDを取得）。
          <br />
          ボット対策には
          <code className="mx-1 rounded bg-stone-200 px-1">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>
          （Cloudflare Turnstile）を追加設定してください。
        </p>
      </div>
    );
  }

  return (
    <>
      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="lazyOnload"
          onLoad={() => setScriptReady(true)}
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-stone-700">
          お名前 <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="山田 太郎"
          disabled={status === "submitting"}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
          メールアドレス <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="example@example.com"
          disabled={status === "submitting"}
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-stone-700">
          件名 <span className="text-red-500">*</span>
        </label>
        <input
          id="subject"
          name="_subject"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="ezcsvについてのご質問"
          disabled={status === "submitting"}
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-stone-700">
          メッセージ <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
        <div ref={turnstileContainerRef} id="turnstile-container" />
      )}

      <div>
        <button
          type="submit"
          disabled={status === "submitting" || !turnstileReady}
          className="rounded-md bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting"
            ? "送信中..."
            : !turnstileReady && TURNSTILE_SITE_KEY
              ? "認証を完了してください"
              : "送信する"}
        </button>
      </div>
    </form>
    </>
  );
}
