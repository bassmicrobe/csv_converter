# ezcsv

ブラウザだけで動くCSV編集ツール。データをサーバーに送らず安全に編集できます。

## 主な特徴

- **ブラウザ完結** - データはサーバーに一切送信されない
- **仮想スクロール** - 最大5万行まで対応（全行DOM描画なし）
- **セル単位編集** - 即時反映、自動変換なし
- **検索・フィルタ** - カラム指定で検索
- **柔軟な入出力** - UTF-8/Shift_JIS、カンマ/タブ区切り、CRLF/LF 対応

## セットアップ

```bash
npm install
npm run dev
```

## Basic認証（オプション）

環境変数 `BASIC_AUTH_USER` と `BASIC_AUTH_PASSWORD` を両方設定すると、全ページに Basic 認証がかかります。未設定の場合は認証なしで動作します。

```bash
# .env.local に設定（本番・Vercel では Project Settings > Environment Variables）
BASIC_AUTH_USER=your_username
BASIC_AUTH_PASSWORD=your_password
```

## ビルド

```bash
npm run build
npm start
```

## Vercel デプロイ

1. [Vercel](https://vercel.com) にリポジトリをインポート
2. ビルドコマンド: `npm run build`
3. ドメイン ezcsv.com をプロジェクトに紐付け

## ドキュメント

- [仕様書](docs/admin/ezcsv_仕様書.md) - 機能仕様、技術仕様、制約など

## 技術スタック

- Next.js 16.1.6
- React 19
- Tailwind CSS 4
- @tanstack/react-virtual
- iconv-lite（Shift_JIS 対応）

## ライセンス

MIT
