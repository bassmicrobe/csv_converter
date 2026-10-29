"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

// 開発時のみ Turnstile テストサイトキー（本番でフォールバックするとボットにも通りやすい）
const TURNSTILE_TEST_KEY = "1x00000000000000000000AA";
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  (process.env.NODE_ENV === "development" ? TURNSTILE_TEST_KEY : "");

interface TurnstileApi {
  ready: (callback: () => void) => void;
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: "light";
      size: "flexible";
      "response-field": false;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

function getTurnstile() {
  return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

export function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const [challengeReady, setChallengeReady] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const widgetContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef("");
  const submitting = useRef(false);

  const resetChallenge = useCallback(() => {
    token.current = "";
    setChallengeReady(false);
    if (widgetId.current !== null) {
      try {
        getTurnstile()?.reset(widgetId.current);
        setChallengeError(null);
      } catch {
        setChallengeError(
          "認証を再開できませんでした。ページを再読み込みしてください。",
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!scriptReady || !TURNSTILE_SITE_KEY) return;
    const api = getTurnstile();
    if (!api) return;
    let active = true;
    api.ready(() => {
      if (!active || !widgetContainer.current || widgetId.current !== null)
        return;
      try {
        const id = api.render(widgetContainer.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "light",
          size: "flexible",
          "response-field": false,
          callback: (value) => {
            if (!active) return;
            token.current = value;
            setChallengeReady(true);
            setChallengeError(null);
          },
          "expired-callback": () => {
            if (active) resetChallenge();
          },
          "error-callback": () => {
            if (!active) return;
            token.current = "";
            setChallengeReady(false);
            setChallengeError("認証に失敗しました。認証をやり直してください。");
          },
        });
        if (id === undefined) {
          setChallengeError(
            "認証を表示できませんでした。ページを再読み込みしてください。",
          );
        } else {
          widgetId.current = id;
        }
      } catch {
        setChallengeError(
          "認証を表示できませんでした。ページを再読み込みしてください。",
        );
      }
    });
    return () => {
      active = false;
      if (widgetId.current !== null) api.remove(widgetId.current);
      widgetId.current = null;
      token.current = "";
    };
  }, [scriptReady, resetChallenge]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting.current) return;
    if (TURNSTILE_SITE_KEY && !token.current) {
      setStatus("error");
      setErrorMessage("認証を完了してから送信してください。");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    if (TURNSTILE_SITE_KEY)
      formData.set("cf-turnstile-response", token.current);

    submitting.current = true;
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
    } finally {
      // Siteverify tokens are single-use, including when the later email send fails.
      // Reset only the challenge so a retry preserves the user's message.
      resetChallenge();
      submitting.current = false;
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
            className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
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
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
          onError={() =>
            setChallengeError(
              "認証を読み込めませんでした。接続を確認してページを再読み込みしてください。",
            )
          }
        />
      )}
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        aria-busy={status === "submitting"}
      >
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
            maxLength={100}
            autoComplete="name"
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
            maxLength={254}
            autoComplete="email"
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
            maxLength={200}
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
            maxLength={5000}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="お問い合わせ内容をご記入ください"
            disabled={status === "submitting"}
          />
        </div>

        {status === "success" && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
          >
            送信が完了しました。ありがとうございます。
          </div>
        )}

        {status === "error" && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
          >
            {errorMessage}
          </div>
        )}

        {TURNSTILE_SITE_KEY && (
          <div>
            <div ref={widgetContainer} className="min-h-[65px]" />
            {!scriptReady && !challengeError && (
              <p role="status" className="mt-2 text-sm text-stone-600">
                認証を読み込み中...
              </p>
            )}
            {challengeError && (
              <div className="mt-2 text-sm text-red-800">
                <p role="alert">{challengeError}</p>
                {widgetId.current !== null && (
                  <button
                    type="button"
                    onClick={resetChallenge}
                    className="mt-2 min-h-11 cursor-pointer underline underline-offset-4"
                  >
                    認証をやり直す
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={
              status === "submitting" ||
              (Boolean(TURNSTILE_SITE_KEY) && !challengeReady)
            }
            className="rounded-md bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting" ? "送信中..." : "送信する"}
          </button>
        </div>
      </form>
    </>
  );
}
