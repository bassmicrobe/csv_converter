import Link from "next/link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 bg-stone-100/50">
      <div className="mx-auto max-w-[1600px] px-4 py-12 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/"
              className="text-lg font-bold text-stone-900 hover:text-amber-600"
            >
              ezcsv
            </Link>
            <p className="mt-2 max-w-sm text-sm text-stone-600">
              秘匿情報・個人情報を含むCSVをサーバーに送信せず、ブラウザ上のみで安全に編集できます。データはサーバーに送信されません。
            </p>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:gap-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                特徴
              </h3>
              <ul className="mt-2 space-y-2 text-sm text-stone-600">
                <li>ブラウザ完結</li>
                <li>最大5万行対応</li>
                <li>UTF-8 / Shift_JIS 対応</li>
                <li>仮想スクロール</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                セキュリティ
              </h3>
              <ul className="mt-2 space-y-2 text-sm text-stone-600">
                <li>サーバー送信なし</li>
                <li>外部通信なし</li>
                <li>ローカル保存なし</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-stone-200 pt-8 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/terms" className="text-sm text-stone-500 hover:text-amber-600">
              利用規約
            </Link>
            <Link href="/privacy" className="text-sm text-stone-500 hover:text-amber-600">
              プライバシーポリシー
            </Link>
            <a
              href="https://www.cybereye-tech.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-500 hover:text-amber-600"
            >
              運営会社
            </a>
          </div>
          <p className="text-sm text-stone-500">
            © {currentYear}{" "}
            <a
              href="https://www.cybereye-tech.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-600"
            >
              サイバーアイ・テクノロジー株式会社
            </a>{" "}
            — ezcsv 秘匿情報・個人情報を含むCSVを安全に編集（
            <strong>データはサーバーに送信されません</strong>
            ）
          </p>
        </div>
      </div>
    </footer>
  );
}
