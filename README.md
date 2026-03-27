# ezcsv

ブラウザだけで動くCSV編集ツール。データをサーバーに送らず安全に編集できます。

## 主な特徴

- **ブラウザ完結** - データはサーバーに一切送信されない
- **仮想スクロール** - 最大5万行まで対応（全行DOM描画なし）
- **セル単位編集** - 即時反映、自動変換なし
- **検索・フィルタ** - カラム指定で検索
- **柔軟な入出力** - UTF-8/Shift_JIS、カンマ/タブ区切り、CRLF/LF 対応

## セットアップ

[pnpm](https://pnpm.io/) を利用します（Node.js に付属の Corepack で有効化できます）。

```bash
corepack enable
pnpm install
pnpm dev
```

### 品質チェック（Lint / 型検査 / テスト）

```bash
pnpm lint          # Biome（フォーマット含む静的解析）
pnpm run typecheck # TypeScript（next プラグインなしの tsconfig で検査）
pnpm test          # Vitest（ウォッチ）
pnpm run test:run  # Vitest 一回実行
pnpm run check     # 上記をまとめて（lint + typecheck + test:run）
```

コミット前に [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) でステージしたファイルに対して Biome が走ります。

## Basic認証（オプション）

環境変数 `BASIC_AUTH_USER` と `BASIC_AUTH_PASSWORD` を両方設定すると、全ページに Basic 認証がかかります。`BASIC_AUTH_ENABLED=false` または `0` で認証を無効化できます（認証情報は残したまま OFF にできる）。

```bash
# .env.local に設定（本番・Vercel では Project Settings > Environment Variables）
BASIC_AUTH_ENABLED=true   # false または 0 で認証オフ
BASIC_AUTH_USER=your_username
BASIC_AUTH_PASSWORD=your_password
```

## ビルド

```bash
pnpm run build
pnpm start
```

## Vercel デプロイ

1. [Vercel](https://vercel.com) にリポジトリをインポート
2. ビルドコマンド: `pnpm run build`（Vercel はリポジトリ直下の `pnpm-lock.yaml` を検出すると pnpm を使います）
3. ドメイン ezcsv.com をプロジェクトに紐付け

## ドキュメント

- [仕様書](docs/admin/ezcsv_仕様書.md) - 機能仕様、技術仕様、制約など

## 技術スタック

- Next.js 16.2.1
- React 19
- Tailwind CSS 4
- Biome（Lint / Format）、Vitest、Husky、lint-staged
- @tanstack/react-virtual
- iconv-lite（Shift_JIS 対応）

## ライセンス

MIT
