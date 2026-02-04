const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ezcsv",
  alternateName: "ezcsv CSV編集ツール",
  url: "https://ezcsv.com",
  description:
    "ezcsvはブラウザだけで動くCSV編集ツール。データをサーバーに送らず、秘匿情報・個人情報を安全に編集できます。UTF-8/Shift_JIS対応、最大5万行、仮想スクロール。",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "JPY",
  },
  featureList: [
    "ブラウザ完結でデータをサーバーに送信しない",
    "UTF-8/Shift_JIS対応",
    "最大5万行の仮想スクロール",
    "検索・フィルタ・ソート",
    "列のドラッグで並び替え",
  ],
  inLanguage: "ja",
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
