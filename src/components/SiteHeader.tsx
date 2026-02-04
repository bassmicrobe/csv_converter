import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight text-stone-900 transition hover:text-amber-600"
        >
          <span className="text-xl">ezcsv</span>
          <span className="hidden text-sm font-normal text-stone-500 sm:inline">
            ブラウザ完結のCSV編集
          </span>
        </Link>
      </div>
    </header>
  );
}
