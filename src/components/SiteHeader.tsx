import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          aria-label="ezcsv ホーム"
          className="flex items-center gap-3 rounded-sm transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
        >
          <BrandLogo className="h-12 w-auto" />
          <span className="hidden text-sm font-normal text-stone-500 sm:inline">
            ブラウザ完結のCSV編集
          </span>
        </Link>
      </div>
    </header>
  );
}
