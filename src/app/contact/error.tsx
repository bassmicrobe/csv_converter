"use client";

import Link from "next/link";

export default function ContactError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-[600px] px-4 py-12 md:px-6">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-amber-600 hover:text-amber-700"
        >
          ← ezcsv トップへ
        </Link>
      </div>

      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">エラーが発生しました</h2>
        <p className="mt-2 text-sm text-red-800">
          お問い合わせフォームの読み込み中に問題が発生しました。しばらくしてから再度お試しください。
        </p>
        <p className="mt-4">
          <a
            href="https://cybereye-tech.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:underline"
          >
            運営会社のお問い合わせ窓口
          </a>
          からもお問い合わせいただけます。
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          再試行
        </button>
      </div>
    </main>
  );
}
