import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const siteUrl = "https://ezcsv.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ezcsv | ブラウザで動くCSV編集ツール - データ送信なしで安全に編集",
    template: "%s | ezcsv",
  },
  description:
    "ezcsvはブラウザだけで動くCSV編集ツール。データをサーバーに送らず、秘匿情報・個人情報を安全に編集できます。UTF-8/Shift_JIS対応、最大5万行、仮想スクロール。",
  keywords: [
    "CSV",
    "CSV編集",
    "CSVエディタ",
    "エクセル",
    "データ編集",
    "ブラウザ",
    "セキュリティ",
    "個人情報",
    "UTF-8",
    "Shift_JIS",
  ],
  authors: [{ name: "ezcsv" }],
  creator: "ezcsv",
  publisher: "ezcsv",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "ezcsv",
    title: "ezcsv | ブラウザで動くCSV編集ツール - データ送信なしで安全に編集",
    description:
      "ブラウザだけで動くCSV編集ツール。データをサーバーに送らず、秘匿情報を安全に編集。UTF-8/Shift_JIS対応。",
  },
  twitter: {
    card: "summary_large_image",
    title: "ezcsv | ブラウザで動くCSV編集ツール",
    description: "データをサーバーに送らず、ブラウザだけで安全にCSVを編集",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "technology",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <JsonLd />
      </head>
      <body className="antialiased bg-stone-50 text-stone-900 min-h-screen">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <Analytics />
        </div>
      </body>
    </html>
  );
}
