import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "ezcsv（無料オンラインCSV編集ツール）のプライバシーポリシーです。データの取り扱いについて説明します。",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[800px] px-4 py-12 md:px-6">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-emerald-700 hover:text-emerald-700"
        >
          ← ezcsv トップへ
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-stone-900">
        プライバシーポリシー
      </h1>
      <p className="mt-2 text-sm text-stone-500">最終更新日: 2026年10月29日</p>

      <div className="mt-8 space-y-8 text-stone-700">
        <section>
          <h2 className="text-lg font-semibold text-stone-900">1. 基本方針</h2>
          <p className="mt-2 leading-relaxed">
            ezcsv（以下「本サービス」）は、利用者のプライバシーを尊重し、個人情報の保護に努めます。本サービスは、CSVデータを一切サーバーに送信せず、すべての処理をブラウザ内で完結させています。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">
            2. 収集する情報
          </h2>
          <p className="mt-2 leading-relaxed">
            本サービスでは、
            <strong>
              CSVファイルの内容や編集データを収集・送信することはありません
            </strong>
            。ファイルの読み込み、編集、エクスポートはすべて利用者の端末内で行われます。
          </p>
          <p className="mt-2 leading-relaxed">
            当サイトは、以下の情報を収集する場合があります。
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 pl-2">
            <li>
              <strong>アクセス解析（Vercel Analytics）</strong>
              <br />
              同意した場合に限り、ページの閲覧数、リファラー、デバイス種別などの利用状況データを収集します。CSVファイルの内容は送信しません。
            </li>
            <li>
              <strong>お問い合わせ</strong>
              <br />
              フォームに入力したお名前、メールアドレス、件名、本文を、お問い合わせへの対応と返信のために利用します。
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">
            3. クッキー（Cookie）とアクセス解析
          </h2>
          <p className="mt-2 leading-relaxed">
            本サービスでは、アクセス解析（Vercel
            Analytics）の利用について、初回アクセス時に同意の可否を確認するバナーを表示しています。「許可する」を選択した場合のみ解析が有効になります。同意・拒否の選択のみLocalStorageに保存します。フッターの「アクセス解析の設定」から選択を変更し、解析を無効にできます。CSVデータの保存にクッキーやLocalStorageは使用しません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">
            4. データの保存
          </h2>
          <p className="mt-2 leading-relaxed">
            本サービスは、利用者が読み込んだCSVデータをサーバーに保存しません。LocalStorage、SessionStorage、IndexedDB
            等のローカルストレージにもCSVデータを保存しません。CSVデータはブラウザのメモリ上でのみ保持され、ページの再読み込みや終了時に失われます。必要なデータはCSV等としてご自身で保存してください。アクセス解析への同意・拒否の選択は、CSVデータとは別にLocalStorageへ保存します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">
            5. 第三者提供
          </h2>
          <p className="mt-2 leading-relaxed">
            CSVデータはサーバーに送信されないため、第三者に提供されることはありません。アクセス解析データは、Vercel
            のサービスを通じて収集されます。お問い合わせ時には、迷惑送信対策にCloudflare
            Turnstile、メール送信にAWS
            SESを利用し、入力内容や送信に必要な情報を取り扱います。これらの処理のために外部通信が発生します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">
            6. ポリシーの変更
          </h2>
          <p className="mt-2 leading-relaxed">
            本ポリシーは、必要に応じて変更することがあります。変更後は当サイトに掲載した時点で効力を生じるものとします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">
            7. お問い合わせ
          </h2>
          <p className="mt-2 leading-relaxed">
            プライバシーに関するお問い合わせは、
            <Link
              href="/contact"
              className="text-emerald-700 hover:text-emerald-700"
            >
              お問い合わせフォーム
            </Link>
            または運営会社（
            <a
              href="https://cybereye-tech.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-700"
            >
              サイバーアイ・テクノロジー株式会社
            </a>
            ）までご連絡ください。
          </p>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-emerald-700 hover:text-emerald-700">
          ← トップページに戻る
        </Link>
      </div>
    </main>
  );
}
