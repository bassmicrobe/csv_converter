import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactFormLoader";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "ezcsv（無料オンラインCSV編集ツール）へのお問い合わせ窓口です。",
};

export default function ContactPage() {
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

      <h1 className="text-2xl font-bold text-stone-900">お問い合わせ</h1>
      <p className="mt-2 text-stone-600">
        ezcsv に関するご質問・ご要望がございましたら、以下のフォームよりお送りください。
      </p>

      <div className="mt-8">
        <ContactForm />
      </div>

      <p className="mt-8 text-sm text-stone-500">
        運営：
        <a
          href="https://www.cybereye-tech.jp/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-amber-600 hover:underline"
        >
          サイバーアイ・テクノロジー株式会社
        </a>
      </p>

      <div className="mt-12">
        <Link
          href="/"
          className="text-amber-600 hover:text-amber-700"
        >
          ← トップページに戻る
        </Link>
      </div>
    </main>
  );
}
