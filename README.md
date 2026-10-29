<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/ezcsv-lockup-dark.svg" />
    <img src="public/brand/ezcsv-lockup-light.svg" alt="ezcsv" width="280" />
  </picture>
</p>

# ezcsv

**ブラウザだけで動く無料のCSV・TSV編集ツール。CSVデータをサーバーに送信せず、編集・変換・エクスポートできます。**

**[ezcsv.com を開く](https://ezcsv.com)**

## 概要

CSV処理はブラウザ内で完結し、読み込んだデータはサーバーに送信せず、LocalStorageなどにも保存しません。同意した場合のアクセス解析と、お問い合わせ送信には外部通信を利用します。アクセス解析への同意状態のみLocalStorageに保存し、フッターの「アクセス解析の設定」から変更できます。

- **ブラウザ内でCSV処理** — データを外部に送信しない設計。
- **最大5万行** — 仮想スクロールで大きな表も編集可能。
- **表の編集** — セル編集、行・列の追加／削除／クリア、列のドラッグ並び替え、Undo／Redo。
- **検索・整理** — 列を指定した検索・フィルタ、ソート、1行目のヘッダー扱い。
- **入出力設定** — UTF-8／Shift_JIS、カンマ／タブ、CRLF／LFに対応。読み込み時に自動判別し、出力時に変更可能。
- **出力** — CSV・TSV・PDFの保存と、行データからのQRコード生成（最大1,000件、ZIP一括保存）。

PDFはブラウザの描画・メモリ上限を考慮し、500行・10,000セルまで対応します。上限を超える表はCSV・TSVで保存してください。QRコードは検索結果を対象とし、検索0件の場合は出力しません。セル編集中のEscapeで変更を取り消せます。列見出しにフォーカスしてAlt+←／Alt+→で列を移動できます。

対応する入力ファイルは `.csv`・`.tsv`・`.txt` です。Excelブック（`.xlsx`）は、CSVに書き出してから読み込んでください。

## 技術スタック

- Next.js 16 / React 19 / TypeScript 5
- Tailwind CSS 4 / @tanstack/react-virtual
- iconv-lite / html2pdf.js / qrcode / JSZip
- AWS SDK for SES / Cloudflare Turnstile / Vercel Analytics（同意時のみ）
- Biome / Vitest / Husky / lint-staged / sharp（ブランド画像生成）

## セットアップ

Node.js 22.12以上と、`package.json` の `packageManager` で指定したpnpmを利用します。

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

開発サーバーは [localhost:3000](http://localhost:3000) で開けます。環境変数が必要な場合は `.env.example` を `.env.local` にコピーして設定してください。CSV編集機能だけを使う場合、AWSなどの設定は不要です。

### 品質チェック

```bash
corepack pnpm lint          # BiomeによるLint・フォーマット確認
corepack pnpm run typecheck # TypeScript型検査
corepack pnpm test          # Vitest（ウォッチ）
corepack pnpm run test:run  # Vitest一回実行
corepack pnpm run check     # Lint・型検査・テストをまとめて実行
corepack pnpm run build     # 本番ビルド
```

コミット前にはHuskyとlint-stagedでBiomeが実行されます。チェックとGitフックはCorepack経由で、プロジェクトで指定したpnpmを使います。テストツールの依存関係はVite 7.3.7を指定し、esbuildは脆弱性修正版の0.28.1以降を使うようpnpmのoverrideを設定しています。

### 環境変数

**Basic認証（任意）** — `BASIC_AUTH_USER` と `BASIC_AUTH_PASSWORD` を両方設定すると、サイトにBasic認証がかかります。`BASIC_AUTH_ENABLED=false` または `0` で無効化できます。

明示的に有効化したのに認証情報がない場合、またはユーザー名・パスワードの片方しかない場合は、公開せず503を返します。設定値を修正してから利用してください。

**お問い合わせフォーム** — メール送信にはAWS SESを利用します。本番ではCloudflare Turnstileのサイトキーとシークレットも必要です。

お問い合わせのリクエスト本文は64KiBまでです。Turnstileは送信先のホスト名も検証します。レート制限はインスタンス単位のため、本番で全インスタンスに共通する制限が必要な場合は共有ストレージやWAFを併用してください。

| 環境変数                                                  | 内容                                                 |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `SES_FROM_EMAIL` / `SES_TO_EMAIL`                         | SESで検証済みの送信元／お問い合わせの送信先          |
| `AWS_REGION`                                              | SESのリージョン（既定値: `us-east-1`）               |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`             | SES送信権限を持つ認証情報（または実行環境のIAM認証） |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstileのキー（本番では両方必須）       |
| `CONTACT_AUTOREPLY_ENABLED`                               | 自動返信の有効／無効（`false`で無効）                |

設定例は [`.env.example`](.env.example) を参照してください。認証情報はリポジトリにコミットしないでください。

### ビルド・デプロイ

```bash
corepack pnpm run build
corepack pnpm start
```

Vercelでは、このリポジトリをインポートしてNext.jsプロジェクトとして構成し、必要な環境変数を設定します。`pnpm-lock.yaml` と `packageManager` でpnpmのバージョンを固定しています。ビルドコマンドは `pnpm run build`、公開ドメインは `ezcsv.com` です。

## 構成

ブランドロゴのSVGは [`public/brand`](public/brand) に格納しています。favicon（`src/app/icon.svg`・`src/app/favicon.ico`）、Appleホーム画面アイコン（`src/app/apple-icon.png`）、Webアプリ用アイコン（`public/icons/`）、OGP画像（`src/app/opengraph-image.png`）は、元のSVGを差し替えたあと次のコマンドで再生成し、生成物もコミットしてください。

```bash
corepack pnpm run assets:generate
```

詳細は [ブランド素材ガイド](docs/brand_assets.md) を参照してください。

## ドキュメント

- [仕様書](docs/admin/ezcsv_仕様書.md) — 機能仕様、技術仕様、制約など
- [ブランド素材ガイド](docs/brand_assets.md) — ロゴ・favicon・OGPの素材一覧と再生成手順
- [2026-10-29 監査・修正記録](docs/audits/2026-10-29.md) — 性能・UI/UX・セキュリティの検証結果と制約
