[![en](https://img.shields.io/badge/lang-English-blue.svg)](./README.md)

# saneatsu.me

個人のポートフォリオ・ブログサイト。

## 技術スタック

- **フロントエンド**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, next-intl
- **バックエンド**: Hono, Drizzle ORM
- **データベース**: Turso (libSQL)
- **インフラ**: Cloudflare Workers, Cloudflare Images
- **テスト**: Vitest, Storybook, Playwright
- **リンター/フォーマッター**: Biome
- **その他**: Google Gemini API（記事の翻訳）

## プロジェクト構成

```
.
├── apps/
│   ├── backend/     # バックエンド API (Hono on Cloudflare Workers)
│   ├── frontend/    # フロントエンド (Next.js)
│   └── docs/        # ドキュメント (Docusaurus)
├── packages/
│   ├── db/          # データベーススキーマ & ユーティリティ
│   ├── i18n/        # 国際化ユーティリティ & 翻訳
│   └── schemas/     # 共有スキーマ定義 (Zod)
└── scripts/         # ビルド & デプロイスクリプト
```

## セットアップ

### 前提条件

- Node.js 18+
- pnpm 10+

### インストール

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp apps/backend/.env.example apps/backend/.env
```

**重要**: `apps/backend/.env` を作成した後、以下の環境変数を設定してください：

- `TURSO_DATABASE_URL`: Turso データベース URL
- `TURSO_AUTH_TOKEN`: Turso 認証トークン
- `ADMIN_EMAILS`: 管理者メールアドレス（カンマ区切り）

### 環境変数

`apps/backend/.env` に以下を設定：

```bash
# Turso データベース
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Google Gemini API（記事の翻訳用）
GEMINI_API_KEY=your-gemini-api-key

# 管理者メールアドレス（Google Auth用）
# 複数の場合はカンマ区切り
ADMIN_EMAILS=your-admin-email@example.com
```

## 開発

```bash
# 開発サーバーの起動（全アプリ）
pnpm dev

# フロントエンドのみ
pnpm --filter @saneatsu/frontend dev

# バックエンドのみ
pnpm --filter @saneatsu/backend dev

# ビルド
pnpm build

# テスト実行
pnpm vitest

# 型チェック
pnpm type-check

# リント & フォーマット
pnpm check
```

## テスト

```bash
# Vitest（ユニット & 結合テスト）
pnpm vitest

# Storybook テスト
cd apps/frontend && pnpm test-storybook:smart

# E2E テスト（Playwright）
cd apps/frontend && pnpm e2e

# E2E テスト（UIモード）
cd apps/frontend && pnpm e2e:ui
```

## データベース

```bash
# マイグレーションの生成
pnpm --filter @saneatsu/db db:generate

# マイグレーションの実行
pnpm --filter @saneatsu/db db:push

# シードデータの投入
pnpm seed

# Drizzle Studio（GUI）
pnpm --filter @saneatsu/db db:studio
```

## デプロイ

```bash
# 開発環境へデプロイ
pnpm deploy:dev

# プレビュー環境へデプロイ
pnpm deploy:preview

# 本番環境へデプロイ
pnpm deploy:prod
```

## コミット規約

[Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) に準拠。

```
feat: 新機能の追加
fix: バグ修正
docs: ドキュメントの更新
style: コードスタイルの変更
refactor: リファクタリング
test: テストの追加・修正
chore: ビルドプロセスやツールの変更
```

## ライセンス

Private

## 著者

saneatsu
