---
sidebar_position: 3
---

# 環境変数管理

saneatsu.meプロジェクトでは、すべての環境変数をGitHub Secrets/Variablesで一元管理し、CI/CDパイプラインでビルド時に自動注入する仕組みを採用しています。これにより、セキュリティを保ちながら、管理を簡素化できます。

## 概要

### GitHub Secrets中心の環境変数管理

**管理方針:**
- **すべての環境変数をGitHub Secrets/Variablesで管理**
- **Cloudflare Worker Secretsは使用しない**
- **CI/CDパイプラインで自動的に.envファイルを生成・注入**

**利点:**
- 一元管理による運用コストの削減
- GitHubのアクセス制御を活用したセキュリティ向上
- バージョン管理と変更履歴の追跡
- 手動設定作業の排除

## 環境変数の分類

すべての環境変数はGitHub Secrets/Variablesで管理され、CI/CDパイプラインでビルド時に.envファイルが自動生成されます。

### 1. Repository Secrets（機密情報）

セキュリティが重要な値は Repository Secrets で管理します。

| 変数名 | 用途 | 使用場所 | 説明 |
|--------|------|----------|------|
| `TURSO_DATABASE_URL_PROD` | 本番DB接続URL | Backend | 本番環境のTurso データベースURL |
| `TURSO_DATABASE_URL_PREVIEW` | プレビューDB接続URL | Backend | プレビュー環境のTurso データベースURL |
| `TURSO_AUTH_TOKEN_PROD` | 本番DB認証トークン | Backend | 本番環境のTurso 認証トークン |
| `TURSO_AUTH_TOKEN_PREVIEW` | プレビューDB認証トークン | Backend | プレビュー環境のTurso 認証トークン |
| `CORS_ORIGIN_PROD` | 本番CORS許可オリジン | Backend | `https://saneatsu.me` |
| `CORS_ORIGIN_PREVIEW` | プレビューCORS許可オリジン | Backend | プレビュー環境のWorkerドメイン |
| `NEXTAUTH_SECRET` | NextAuth.js暗号化キー | Web | JWT暗号化・署名用（32文字以上） |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | Web | Google認証設定 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth シークレット | Web | Google認証設定 |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID | CI/CD | デプロイ用 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン | CI/CD | デプロイ用 |

### 2. Repository Variables（公開可能情報）

公開されても問題ない設定値は Repository Variables で管理します。

| 変数名 | 用途 | 使用場所 | 説明 |
|--------|------|----------|------|
| `ADMIN_EMAILS` | 管理者メールアドレス | Backend & Web | **カンマ区切りで複数設定可能**<br />`user1@example.com,user2@example.com` |

### ADMIN_EMAILSの詳細

**設定方法:**
```
user1@gmail.com,user2@example.com,admin@company.com
```

**特徴:**
- **複数の管理者を設定可能**（カンマ区切り）
- 前後の空白は自動でトリミング
- Backend（Auth API）とWeb（フロントエンド認証）の両方で使用
- 設定されたメールアドレス以外のGoogle認証を拒否

**使用箇所:**
- Google認証時の管理者権限チェック
- Auth APIでのユーザー作成・更新権限チェック

## 設定方法

### GitHub Secrets/Variablesの設定

すべての環境変数はGitHubで一元管理します。Cloudflare Worker Secretsの設定は**不要**です。

#### Repository Secretsの設定

1. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** にアクセス
2. **Secrets** タブを選択
3. **New repository secret** をクリック
4. 名前と値を入力して **Add secret**

**設定が必要なSecrets:**
```bash
TURSO_DATABASE_URL_PROD=libsql://your-prod-db.turso.io
TURSO_DATABASE_URL_PREVIEW=libsql://your-preview-db.turso.io
TURSO_AUTH_TOKEN_PROD=eyJ...
TURSO_AUTH_TOKEN_PREVIEW=eyJ...
CORS_ORIGIN_PROD=https://saneatsu.me
CORS_ORIGIN_PREVIEW=https://saneatsu-web-preview.w-saneatsu-e8c.workers.dev
NEXTAUTH_SECRET=32文字以上のランダムな文字列
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
```

#### Repository Variablesの設定

1. 同じ画面で **Variables** タブを選択
2. **New repository variable** をクリック
3. 名前と値を入力して **Add variable**

**設定が必要なVariables:**
```bash
ADMIN_EMAILS=user1@gmail.com,user2@example.com,admin@company.com
```

### 自動化されるプロセス

GitHub Secrets/Variablesを設定すると、CI/CDパイプラインが自動的に：

1. **環境変数ファイル生成**: `.env`ファイルが自動生成
2. **ビルド時注入**: Next.js/Honoビルド時に環境変数を注入
3. **Cloudflareデプロイ**: 環境変数が埋め込まれたWorkerをデプロイ

**手動でのCloudflare Worker Secrets設定は不要**です。

### wrangler.tomlの設定

wrangler.tomlには**環境変数を含めません**。すべてGitHub Secrets/Variablesで管理します。

```toml
# apps/backend/wrangler.toml
name = "saneatsu-api"
main = "src/worker.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[env.preview]
name = "saneatsu-backend-preview"

[env.production]
name = "saneatsu-backend"

[[env.production.routes]]
pattern = "api.saneatsu.me/*"
zone_name = "saneatsu.me"

[build]
command = "pnpm build"
```

## 環境別の設定値

### Production環境

| 変数名 | 設定値 |
|--------|--------|
| `CORS_ORIGIN_PROD` | `https://saneatsu.me` |
| `ADMIN_EMAILS` | `実際の管理者メールアドレス（カンマ区切り）` |

### Preview環境

| 変数名 | 設定値 |
|--------|--------|
| `CORS_ORIGIN_PREVIEW` | `https://saneatsu-web-preview.w-saneatsu-e8c.workers.dev` |
| `ADMIN_EMAILS` | `実際の管理者メールアドレス（カンマ区切り）` |

**注意:** `NEXT_PUBLIC_API_URL`と`NEXTAUTH_URL`は、CI/CDパイプラインで環境に応じて自動設定されます。

### Development環境

開発環境では各アプリケーションのルートディレクトリに `.env` ファイルを配置：

```bash
# apps/backend/.env
TURSO_DATABASE_URL=libsql://your-dev-db.turso.io
TURSO_AUTH_TOKEN=your-dev-token
CORS_ORIGIN=http://localhost:3210
ADMIN_EMAILS=your-email@gmail.com

# apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXTAUTH_URL=http://localhost:3210
NEXTAUTH_SECRET=your-dev-secret-32-chars-or-more
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ADMIN_EMAILS=your-email@gmail.com
AUTH_TRUST_HOST=true
```

## セキュリティのベストプラクティス

### 1. GitHub中心の管理

- **すべての環境変数をGitHub Secrets/Variablesで管理**
- **Cloudflare Worker Secretsは使用しない**
- **機密情報はSecrets、公開可能情報はVariables**

### 2. 環境の分離

- Production、Preview、Development で異なる値を使用
- 特にデータベース（Turso）は環境ごとに分離
- ADMIN_EMAILSは全環境で共通設定可能

### 3. 定期的なローテーション

- `NEXTAUTH_SECRET` などの暗号化キーは定期的に更新
- Turso/Cloudflare APIトークンは必要に応じて再生成

### 4. アクセス制限

- **GitHub Repository Secrets/Variablesのアクセス権限で管理**
- 必要最小限のメンバーにのみ書き込み権限を付与

## トラブルシューティング

### 環境変数が認識されない

1. **GitHub Secrets/Variablesの確認**
   - Settings → Secrets and variables → Actions で設定を確認
   - 名前のスペルミスがないかチェック

2. **CI/CDパイプラインの確認**
   - GitHub Actions のログで`.env`ファイルが正しく生成されているか確認
   - ワークフローが`secrets.`または`vars.`を正しく参照しているか確認
### 500エラーが発生する

環境変数の不足や設定ミスが原因の可能性があります：

1. **GitHub Actionsログを確認**
   ```bash
   # CI/CDパイプラインのログで.env生成エラーをチェック
   # Actions タブ → 最新のワークフロー実行 → ログを確認
   ```

2. **Cloudflare Workerログを確認**
   ```bash
   # リアルタイムログの確認
   wrangler tail --name saneatsu-api
   ```

### 環境変数の更新が反映されない

GitHub Secrets/Variablesを更新した後：

1. **自動反映**: 次回のPush/PRで自動的に新しい値でデプロイされる
2. **手動デプロイ**: 即座に反映したい場合
   ```bash
   # Backendの再デプロイ
   pnpm --filter @saneatsu/backend deploy:production
   
   # Webの再デプロイ  
   pnpm --filter @saneatsu/web deploy:production
   ```

### ADMIN_EMAILSが正しく動作しない

**よくある問題:**
- カンマの後にスペースが入っている → 自動でトリミングされるので問題なし
- メールアドレスの入力ミス → 正確なアドレスを確認
- 大文字小文字の違い → 正確にマッチする必要があります

**設定例:**
```bash
# ✅ 正しい設定
ADMIN_EMAILS=user1@gmail.com,user2@example.com

# ✅ スペースがあってもOK  
ADMIN_EMAILS=user1@gmail.com, user2@example.com, user3@example.com

# ❌ 間違った設定（環境変数名が違う）
ADMIN_EMAIL=user1@gmail.com
```

## 関連ドキュメント

- [CI/CD パイプライン](./ci-cd.md) - GitHub Actions での環境変数の使用方法
- [概要](./overview.md) - デプロイメントアーキテクチャ全体