import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約",
  description: "ezcsv（無料オンラインCSV編集ツール）の利用規約です。",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-[800px] px-4 py-12 md:px-6">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          ← ezcsv トップへ
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-stone-900">利用規約</h1>
      <p className="mt-2 text-sm text-stone-500">最終更新日: 2025年2月</p>

      <div className="mt-8 space-y-8 text-stone-700">
        <section>
          <h2 className="text-lg font-semibold text-stone-900">1. 適用</h2>
          <p className="mt-2 leading-relaxed">
            ezcsv（以下「本サービス」）は、ezcsv.com（以下「当サイト」）が提供する無料のオンラインCSV編集ツールです。本規約は、当サイトの利用条件を定めるものです。本サービスを利用することにより、本規約に同意したものとみなします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">
            2. サービスの内容
          </h2>
          <p className="mt-2 leading-relaxed">
            本サービスは、ブラウザ上でCSV・TSVファイルを編集・変換するためのツールです。すべての処理は利用者のブラウザ内で完結し、CSVデータは当サイトのサーバーに送信されません。無料で提供されており、登録やログインは不要です。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">3. 禁止事項</h2>
          <p className="mt-2 leading-relaxed">
            利用者は、以下の行為を行ってはなりません。
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 pl-2">
            <li>本サービスの運営を妨害する行為</li>
            <li>過度な負荷をかける行為</li>
            <li>法令または公序良俗に反する行為</li>
            <li>第三者に不利益を与える行為</li>
            <li>本サービスの著作権その他の知的財産権を侵害する行為</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">4. 免責事項</h2>
          <p className="mt-2 leading-relaxed">
            本サービスは「現状のまま」提供されます。当サイトは、本サービスの正確性、完全性、有用性等について保証しません。本サービスの利用により生じた損害について、当サイトは一切の責任を負いません。重要なデータは必ずバックアップをとることを推奨します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">
            5. 変更・中止
          </h2>
          <p className="mt-2 leading-relaxed">
            当サイトは、事前の通知なく本サービスの内容を変更し、または提供を中止する場合があります。これにより利用者に生じた損害について、当サイトは責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">
            6. 規約の変更
          </h2>
          <p className="mt-2 leading-relaxed">
            当サイトは、必要に応じて本規約を変更することがあります。変更後の規約は、当サイトに掲載した時点から効力を生じるものとします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">7. 運営会社</h2>
          <p className="mt-2 leading-relaxed">
            本サービスは以下の会社が運営しています。
          </p>
          <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
            <p className="font-semibold text-stone-900">
              <a
                href="https://cybereye-tech.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700"
              >
                サイバーアイ・テクノロジー株式会社
              </a>
            </p>
            <p className="mt-1 text-stone-600">代表取締役 高橋亨</p>
            <p className="mt-1 text-stone-600">
              〒101-0024 東京都千代田区神田和泉町1番地6-16 ヤマトビル405
            </p>
            <p className="mt-2">
              <a
                href="https://cybereye-tech.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700"
              >
                https://cybereye-tech.jp/
              </a>
            </p>
          </div>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-emerald-600 hover:text-emerald-700">
          ← トップページに戻る
        </Link>
      </div>
    </main>
  );
}
