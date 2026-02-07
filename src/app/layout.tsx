import type { Metadata, Viewport } from "next";
import { CookieConsentProvider } from "@/components/CookieConsent";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const siteUrl = "https://ezcsv.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ezcsv | 無料のCSV編集ツール - オンラインでブラウザ完結・データ送信なし",
    template: "%s | ezcsv",
  },
  description:
    "ezcsvは無料のオンラインCSV編集ツール。ブラウザだけでCSV・TSVを編集・変換。データはサーバーに送信されず完全にローカルで動作。UTF-8/Shift_JIS対応、5万行まで、PDF/QRコード出力も可能。",
  keywords: [
    "CSV 編集",
    "CSV エディタ",
    "CSV 編集 オンライン",
    "CSV エディタ 無料",
    "オンライン CSV 編集",
    "CSV 変換",
    "TSV 編集",
    "Excel CSV",
    "データ編集",
    "ブラウザ CSV",
    "個人情報 安全",
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
    title: "ezcsv | 無料のCSV編集ツール - オンラインでブラウザ完結",
    description:
      "無料のオンラインCSV編集ツール。ブラウザだけでCSV・TSVを編集。データ送信なし・UTF-8/Shift_JIS対応・5万行まで。",
  },
  twitter: {
    card: "summary_large_image",
    title: "ezcsv | 無料のCSV編集ツール",
    description: "ブラウザだけでCSVを編集。データ送信なし・無料。",
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
  themeColor: "#10b981",
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
        <ToastProvider>
          <CookieConsentProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>
          </CookieConsentProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
