---
sidebar_position: 3
---

# 環境変数管理

saneatsu.meプロジェクトでは、環境変数を用途に応じて3つのカテゴリに分けて管理しています。これにより、セキュリティを保ちながら、重複を最小限に抑えています。

## 概要

### なぜ環境変数を分けて管理するのか

Cloudflare WorkersとNext.jsを組み合わせて使用する場合、環境変数は以下の2つのタイミングで必要になります：

1. **ビルド時**: Next.jsアプリケーションのビルド中に必要な変数
2. **実行時**: Cloudflare Workersが実際にリクエストを処理する際に必要な変数

これらを適切に分離することで、セキュリティを向上させ、管理を簡素化できます。

## 環境変数の分類

### 1. ビルド時環境変数（GitHub Secrets）

ビルド時にのみ必要で、アプリケーションのコードに埋め込まれる変数です。

| 変数名 | 用途 | セキュリティレベル |
|--------|------|-------------------|
| `NEXT_PUBLIC_API_URL` | APIエンドポイントのURL | 公開可能 |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID | 機密 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン | 機密 |

```yaml
# GitHub Actionsワークフローで使用
env:
  NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
```

### 2. 実行時環境変数（Cloudflare Worker Secrets）

Cloudflare Workersが実行時に参照する機密情報です。

| 変数名 | 用途 | Worker | セキュリティレベル |
|--------|------|--------|-------------------|
| `TURSO_DATABASE_URL` | データベース接続URL | Backend | 機密 |
| `TURSO_AUTH_TOKEN` | データベース認証トークン | Backend | 機密 |
| `CORS_ORIGIN` | CORS許可オリジン | Backend | 公開可能 |
| `ADMIN_EMAILS` | 管理者メールアドレス | Backend | 機密 |
| `NEXTAUTH_URL` | NextAuth.jsのベースURL | Web | 公開可能 |
| `NEXTAUTH_SECRET` | NextAuth.jsの暗号化キー | Web | 機密 |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | Web | 公開可能 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth シークレット | Web | 機密 |
| `ADMIN_EMAILS` | 管理者メールアドレス | Web | 機密 |
| `AUTH_TRUST_HOST` | NextAuth.js Cloudflare対応 | Web | 公開可能 |

### 3. 公開設定値（wrangler.toml）

公開可能で、バージョン管理に含めても問題ない設定値です。

```toml
# apps/backend/wrangler.toml
name = "saneatsu-backend"
compatibility_date = "2024-11-08"

[env.preview]
name = "saneatsu-backend-preview"
```

## 設定方法

### GitHub Secretsの設定

1. GitHubリポジトリの Settings → Secrets and variables → Actions にアクセス
2. "New repository secret" をクリック
3. 名前と値を入力して保存

### Cloudflare Worker Secretsの設定

#### CLIを使用した設定（推奨）

```bash
# Backend Worker（本番環境）
wrangler secret put TURSO_DATABASE_URL --name saneatsu-backend
wrangler secret put TURSO_AUTH_TOKEN --name saneatsu-backend
wrangler secret put CORS_ORIGIN --name saneatsu-backend

# Web Worker（本番環境）
wrangler secret put NEXTAUTH_URL --name saneatsu-web
wrangler secret put NEXTAUTH_SECRET --name saneatsu-web
wrangler secret put GOOGLE_CLIENT_ID --name saneatsu-web
wrangler secret put GOOGLE_CLIENT_SECRET --name saneatsu-web
wrangler secret put ADMIN_EMAILS --name saneatsu-web
wrangler secret put AUTH_TRUST_HOST --name saneatsu-web

# Preview環境の場合は --env preview を追加
wrangler secret put TURSO_DATABASE_URL --env preview --name saneatsu-backend
```

#### スクリプトを使用した設定

プロジェクトに含まれているセットアップスクリプトを使用することもできます：

```bash
# 本番環境の設定
./scripts/setup-cloudflare-env.sh production

# Preview環境の設定
./scripts/setup-cloudflare-env.sh preview
```

### wrangler.tomlの設定

```toml
# apps/backend/wrangler.toml
name = "saneatsu-backend"
main = "dist/index.js"
compatibility_date = "2024-11-08"

[env.preview]
name = "saneatsu-backend-preview"

[env.production]
name = "saneatsu-backend"
routes = [
  { pattern = "api.saneatsu.me/*", zone_name = "saneatsu.me" }
]
```

## 環境別の設定値

### Production環境

| 変数名 | 値の例 |
|--------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api.saneatsu.me` |
| `NEXTAUTH_URL` | `https://saneatsu.me` |
| `CORS_ORIGIN` | `https://saneatsu.me` |

### Preview環境

| 変数名 | 値の例 |
|--------|--------|
| `NEXT_PUBLIC_API_URL` | `https://saneatsu-backend-preview.w-saneatsu-e8c.workers.dev` |
| `NEXTAUTH_URL` | `https://saneatsu-web-preview.w-saneatsu-e8c.workers.dev` |
| `CORS_ORIGIN` | `https://saneatsu-web-preview.w-saneatsu-e8c.workers.dev` |

### Development環境

開発環境では `.env` ファイルを使用します：

```bash
# apps/backend/.env
TURSO_DATABASE_URL=libsql://your-dev-db.turso.io
TURSO_AUTH_TOKEN=your-dev-token
CORS_ORIGIN=http://localhost:3210

# apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXTAUTH_URL=http://localhost:3210
NEXTAUTH_SECRET=your-dev-secret
# ... その他の環境変数
```

## セキュリティのベストプラクティス

### 1. 最小権限の原則

- ビルド時にのみ必要な変数は GitHub Secrets に
- 実行時にのみ必要な変数は Cloudflare Worker Secrets に
- 公開可能な値は wrangler.toml に

### 2. 環境の分離

- Production、Preview、Development で異なる値を使用
- 特にデータベースは環境ごとに分離

### 3. 定期的なローテーション

- `NEXTAUTH_SECRET` などの暗号化キーは定期的に更新
- APIトークンは必要に応じて再生成

### 4. アクセス制限

- GitHub Secrets へのアクセスは必要最小限のメンバーに制限
- Cloudflare Worker Secrets は Cloudflare ダッシュボードのアクセス権限で管理

## トラブルシューティング

### 環境変数が認識されない

1. **ビルド時の変数**
   - GitHub Actions のログで環境変数が設定されているか確認
   - `.env` ファイルが正しく生成されているか確認

2. **実行時の変数**
   ```bash
   # 設定されている変数の一覧を確認
   wrangler secret list --name saneatsu-backend
   ```

### 500エラーが発生する

環境変数の不足が原因の可能性があります：

```bash
# Cloudflare ダッシュボードでWorkerのログを確認
# または wrangler tail コマンドでリアルタイムログを確認
wrangler tail --name saneatsu-backend
```

### 環境変数の更新が反映されない

Cloudflare Worker Secrets を更新した後は、Workerの再デプロイが必要な場合があります：

```bash
# 手動で再デプロイ
pnpm deploy:production
```

## 関連ドキュメント

- [CI/CD パイプライン](./ci-cd.md) - GitHub Actions での環境変数の使用方法
- [概要](./overview.md) - デプロイメントアーキテクチャ全体