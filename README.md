# saneatsu.me

個人ポートフォリオ・ブログサイト

## 🚀 技術スタック

- **フロントエンド**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド**: Cloudflare Workers, Hono
- **データベース**: Turso (SQLite), Drizzle ORM
- **インフラ**: Cloudflare (Workers, Pages, R2)
- **その他**: Google Gemini API (記事翻訳)

## 📦 プロジェクト構成

```
.
├── apps/
│   ├── backend/     # バックエンドAPI (Cloudflare Workers)
│   ├── frontend/    # フロントエンド (Next.js)
│   └── docs/        # ドキュメント (Docusaurus)
├── packages/
│   ├── db/          # データベーススキーマ・ユーティリティ
│   └── schemas/     # 共通スキーマ定義
└── scripts/         # ビルド・デプロイスクリプト
```

## 🛠️ セットアップ

### 必要な環境

- Node.js 18以上
- pnpm 8以上

### インストール

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp apps/backend/.env.example apps/backend/.env
```

**重要**: `apps/backend/.env` を作成後、以下の環境変数を必ず設定してください：

- `TURSO_DATABASE_URL`: Tursoデータベースのurl
- `TURSO_AUTH_TOKEN`: Turso認証トークン
- `ADMIN_EMAILS`: 管理者のメールアドレス（カンマ区切りで複数指定可能）

### 環境変数

`apps/backend/.env` に以下の環境変数を設定してください：

```bash
# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Google Gemini API（記事翻訳機能を使用する場合）
GEMINI_API_KEY=your-gemini-api-key

# Admin Emails（Google Auth認証用）
# 複数の管理者を設定する場合はカンマ区切り
ADMIN_EMAILS=your-admin-email@example.com
```

## 🗄️ Drizzle Studio（データベース管理ツール）

Drizzle Studioは、データベースの内容を視覚的に確認・編集できるGUIツールです。

### 起動方法

```bash
# packages/dbディレクトリに移動
cd packages/db

# Drizzle Studioを起動
pnpm db:studio

# またはプロジェクトルートから
pnpm --filter @saneatsu/db db:studio
```

起動後、ブラウザで `https://local.drizzle.studio` にアクセスします。

### 主な機能

- **テーブル閲覧**: 全テーブルのデータを表形式で確認
- **データ編集**: GUIで直接データの追加・編集・削除
- **SQL実行**: SQLクエリを直接実行
- **スキーマ確認**: テーブル構造とリレーションの確認

### よく使うSQLクエリ

```sql
-- 記事一覧を確認（最新10件）
SELECT * FROM articles 
ORDER BY created_at DESC 
LIMIT 10;

-- 下書き記事のみ表示
SELECT * FROM articles 
WHERE status = 'draft';

-- 記事と翻訳を結合して表示
SELECT 
  a.id,
  a.slug,
  a.status,
  at_ja.title as title_ja,
  at_en.title as title_en
FROM articles a
LEFT JOIN article_translations at_ja 
  ON a.id = at_ja.article_id AND at_ja.language = 'ja'
LEFT JOIN article_translations at_en 
  ON a.id = at_en.article_id AND at_en.language = 'en';
```

## 🏃 開発コマンド

```bash
# 開発サーバー起動（全アプリ）
pnpm dev

# フロントエンドのみ
pnpm --filter @saneatsu/frontend dev

# バックエンドのみ
pnpm --filter @saneatsu/backend dev

# ビルド
pnpm build

# テスト実行
pnpm test

# 型チェック
pnpm type-check

# リンター実行
pnpm check

# データベースのシード実行
pnpm seed
```

## 📊 データベース管理

```bash
# マイグレーション生成
pnpm --filter @saneatsu/db db:generate

# マイグレーション実行
pnpm --filter @saneatsu/db db:push

# シード実行（初期データ投入）
pnpm --filter @saneatsu/db db:seed
```

## 🚢 デプロイ

```bash
# 開発環境へデプロイ
pnpm deploy:dev

# プレビュー環境へデプロイ
pnpm deploy:preview

# 本番環境へデプロイ
pnpm deploy:prod
```

## 📝 コミット規約

[Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) に従っています。

```bash
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイルの変更
refactor: リファクタリング
test: テストの追加・修正
chore: ビルドプロセスや補助ツールの変更
```

## 📄 ライセンス

Private

## 👤 Author

saneatsu