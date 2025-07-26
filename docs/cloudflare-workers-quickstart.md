# Cloudflare Workers デプロイクイックスタート

## 🚀 概要

saneatsu.meプロジェクトをCloudflare Workersにデプロイするための完全ガイドです。このプロジェクトは以下の技術スタックを使用しています：

- **フロントエンド**: Next.js 15 + OpenNext Adapter
- **バックエンド**: Hono + OpenAPIHono
- **データベース**: Turso (libSQL) + Drizzle ORM
- **デプロイ**: Cloudflare Workers

## ✅ 前提条件

- Node.js 18以上
- pnpm 8以上
- Git
- Cloudflareアカウント
- Tursoアカウント

## 📋 セットアップ手順

### 1. プロジェクトのクローン

```bash
git clone https://github.com/your-username/saneatsu.me.git
cd saneatsu.me
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. Cloudflareアカウントの設定

#### Cloudflareにログイン

```bash
pnpm wrangler login
```

#### ドメインの設定（オプション）

1. [Cloudflare Dashboard](https://dash.cloudflare.com)にアクセス
2. ドメイン `saneatsu.me` を追加
3. ネームサーバーを変更

### 4. Tursoデータベースの設定

#### Turso CLIのインストール

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

#### Tursoにログイン

```bash
turso auth login
```

#### データベースの作成

```bash
# 開発用
turso db create dev-saneatsu-me

# プレビュー用
turso db create preview-saneatsu-me

# 本番用
turso db create saneatsu-me
```

#### 認証トークンの生成

```bash
# 開発用
turso db tokens create dev-saneatsu-me

# プレビュー用
turso db tokens create preview-saneatsu-me

# 本番用
turso db tokens create saneatsu-me
```

#### データベースURLの取得

```bash
# 各データベースの情報を表示
turso db show dev-saneatsu-me
turso db show preview-saneatsu-me
turso db show saneatsu-me
```

### 5. 環境変数の設定

#### 自動設定スクリプトを使用

```bash
# 開発環境
pnpm setup:env:dev

# プレビュー環境
pnpm setup:env:preview

# 本番環境
pnpm setup:env:prod
```

#### 手動設定（オプション）

```bash
# バックエンド
cd apps/backend
wrangler secret put TURSO_DATABASE_URL --env development
wrangler secret put TURSO_AUTH_TOKEN --env development

# フロントエンド
cd ../web
wrangler secret put NEXT_PUBLIC_API_URL --env development
```

### 6. データベースのマイグレーション

```bash
# スキーマをデータベースに適用
cd packages/db
pnpm db:push

# シードデータの投入
pnpm seed
```

### 7. ローカルでの動作確認

#### 従来のNode.js環境での確認

```bash
# ルートディレクトリで
pnpm dev
```

#### Cloudflare Workers環境での確認

```bash
# バックエンド（別ターミナル）
cd apps/backend
pnpm dev:worker

# フロントエンド（別ターミナル）
cd apps/web
pnpm preview
```

### 8. デプロイ

#### 開発環境へのデプロイ

```bash
pnpm deploy:dev
```

#### プレビュー環境へのデプロイ

```bash
pnpm deploy:preview
```

#### 本番環境へのデプロイ

```bash
pnpm deploy:prod
```

## 🛠️ 利用可能なコマンド

### ビルド関連

```bash
pnpm build                # 通常のビルド
pnpm build:cloudflare     # Cloudflare Workers用ビルド
```

### 開発関連

```bash
pnpm dev                  # Node.js開発サーバー
pnpm dev:worker           # Cloudflare Workers開発サーバー
pnpm preview              # Cloudflare Workers プレビュー
```

### デプロイ関連

```bash
pnpm deploy               # デフォルト環境へのデプロイ
pnpm deploy:dev           # 開発環境へのデプロイ
pnpm deploy:preview       # プレビュー環境へのデプロイ
pnpm deploy:prod          # 本番環境へのデプロイ
```

### 環境変数設定

```bash
pnpm setup:env            # 開発環境の環境変数設定
pnpm setup:env:dev        # 開発環境の環境変数設定
pnpm setup:env:preview    # プレビュー環境の環境変数設定
pnpm setup:env:prod       # 本番環境の環境変数設定
```

### データベース関連

```bash
cd packages/db

pnpm db:generate          # マイグレーションファイル生成
pnpm db:push              # スキーマをデータベースに適用
pnpm db:studio            # Drizzle Studio起動
pnpm seed                 # シードデータ投入
```

## 📁 プロジェクト構造

```
saneatsu.me/
├── apps/
│   ├── backend/           # Hono API (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── worker.ts  # Cloudflare Workers エントリーポイント
│   │   │   ├── index.ts   # Node.js エントリーポイント
│   │   │   └── routes/    # API ルート
│   │   └── wrangler.toml  # Cloudflare Workers設定
│   └── web/               # Next.js Frontend
│       ├── src/
│       ├── next.config.js # OpenNext設定含む
│       └── wrangler.toml  # Cloudflare Workers設定
├── packages/
│   ├── db/                # データベース スキーマ
│   │   ├── src/
│   │   │   ├── index.ts   # Node.js用
│   │   │   └── worker.ts  # Cloudflare Workers用
│   └── i18n/              # 国際化設定
├── docs/                  # ドキュメント
└── scripts/               # ユーティリティスクリプト
```

## 🔧 設定ファイル

### Cloudflare Workers設定

- `apps/backend/wrangler.toml` - バックエンドAPI設定
- `apps/web/wrangler.toml` - フロントエンド設定

### Next.js設定

- `apps/web/next.config.js` - OpenNext adapter設定

### データベース設定

- `packages/db/drizzle.config.ts` - Drizzle ORM設定

## 🌍 環境別URL

### 開発環境

- **フロントエンド**: `https://saneatsu-web-dev.workers.dev`
- **バックエンド**: `https://saneatsu-api-dev.workers.dev`

### プレビュー環境

- **フロントエンド**: `https://saneatsu-web-preview.workers.dev`
- **バックエンド**: `https://saneatsu-api-preview.workers.dev`

### 本番環境

- **フロントエンド**: `https://saneatsu.me`
- **バックエンド**: `https://api.saneatsu.me`

## 🐛 トラブルシューティング

### デプロイエラー

```bash
# 設定確認
wrangler whoami
wrangler secret list --env development

# ログ確認
wrangler tail --env development
```

### データベース接続エラー

```bash
# Turso接続確認
turso db shell dev-saneatsu-me

# 環境変数確認
echo $TURSO_DATABASE_URL
echo $TURSO_AUTH_TOKEN
```

### ビルドエラー

```bash
# 型チェック
pnpm type-check

# リント
pnpm check

# 依存関係の更新
pnpm install
```

## 📚 参考リンク

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [OpenNext Documentation](https://opennext.js.org/)
- [Hono Documentation](https://hono.dev/)
- [Turso Documentation](https://docs.turso.tech/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## 💡 ヒント

### パフォーマンス最適化

1. 画像は Cloudflare Images を使用
2. キャッシュ戦略を適切に設定
3. エッジでの実行を最大限活用

### セキュリティ

1. 環境変数は必ずシークレットとして設定
2. CORS設定を適切に行う
3. 定期的なセキュリティ監査

### 監視

1. Cloudflare Analytics を活用
2. エラー監視を設定
3. パフォーマンス指標を追跡

---

🎉 **準備完了！** Cloudflare Workersで高速なエッジアプリケーションを楽しんでください！