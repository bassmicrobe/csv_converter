const webApp = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ezcsv",
  alternateName: ["ezcsv CSV編集ツール", "ezcsv CSVエディタ", "ezcsv オンラインCSV編集"],
  url: "https://ezcsv.com",
  description:
    "ezcsvは無料のオンラインCSV編集ツール。ブラウザだけでCSV・TSVを編集・変換。データはサーバーに送信されず完全にローカルで動作。UTF-8/Shift_JIS対応、5万行まで。",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "JPY",
  },
  featureList: [
    "無料でブラウザ完結、データをサーバーに送信しない",
    "UTF-8/Shift_JIS対応、文字コード自動判別",
    "最大5万行の仮想スクロール",
    "検索・フィルタ・ソート・列のドラッグ並び替え",
    "行・列の追加・削除・内容クリア",
    "Undo/Redo対応",
    "CSV/PDFエクスポート、QRコード生成",
  ],
  inLanguage: "ja",
  potentialAction: {
    "@type": "UseAction",
    target: "https://ezcsv.com",
    name: "CSVを編集する",
  },
};

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "ezcsvは無料で使えますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "はい、ezcsvは完全無料で利用できます。登録やログインは不要です。",
      },
    },
    {
      "@type": "Question",
      name: "CSVデータはサーバーに送信されますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "いいえ、すべての処理はブラウザ内で完結します。データはサーバーに送信されず、外部への通信も行いません。",
      },
    },
    {
      "@type": "Question",
      name: "どのような形式のCSVに対応していますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "UTF-8およびShift_JISの文字コード、カンマ・タブ区切り、改行コードLF/CRLFに対応しています。読み込み時に自動判別されます。",
      },
    },
    {
      "@type": "Question",
      name: "Excelで開けるCSVを出力できますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "はい、UTF-8またはShift_JISでCSVをエクスポートできます。Excelで開く場合はShift_JISを選択することをお勧めします。",
      },
    },
  ],
};

export function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
    </>
  );
}
