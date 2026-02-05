"use client";

import { useState } from "react";

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID
  ? `https://formspree.io/f/${process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID}`
  : null;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!FORMSPREE_ENDPOINT) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

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
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(data.error || "送信に失敗しました。しばらくしてからお試しください。");
      }
    } catch {
      setStatus("error");
      setErrorMessage("送信に失敗しました。ネットワーク接続を確認してください。");
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
          フォームから直接送信するには、Vercel の環境変数に
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
        </p>
      </div>
    );
  }

  return (
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

      <div>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-md bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "送信中..." : "送信する"}
        </button>
      </div>
    </form>
  );
}
