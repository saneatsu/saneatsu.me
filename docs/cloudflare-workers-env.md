# Cloudflare Workers 環境変数設定ガイド

## 概要

saneatsu.meプロジェクトをCloudflare Workersにデプロイする際に必要な環境変数の設定方法を説明します。

## 必要な環境変数

### バックエンド API (saneatsu-api)

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `TURSO_DATABASE_URL` | TursoデータベースのURL | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | Tursoデータベースの認証トークン | `eyJhbGciOiJFZERTQSJ...` |
| `CORS_ORIGIN` | CORS許可オリジン | `https://saneatsu.me` |

### フロントエンド (saneatsu-web)

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_API_URL` | バックエンドAPIのURL | `https://api.saneatsu.me` |

## 環境別設定

### Development環境

```bash
# バックエンド
wrangler secret put TURSO_DATABASE_URL --env development
wrangler secret put TURSO_AUTH_TOKEN --env development

# フロントエンド
wrangler secret put NEXT_PUBLIC_API_URL --env development
```

### Preview環境

```bash
# バックエンド
wrangler secret put TURSO_DATABASE_URL --env preview
wrangler secret put TURSO_AUTH_TOKEN --env preview

# フロントエンド  
wrangler secret put NEXT_PUBLIC_API_URL --env preview
```

### Production環境

```bash
# バックエンド
wrangler secret put TURSO_DATABASE_URL --env production
wrangler secret put TURSO_AUTH_TOKEN --env production

# フロントエンド
wrangler secret put NEXT_PUBLIC_API_URL --env production
```

## Cloudflareダッシュボードでの設定

### 1. Cloudflareダッシュボードにアクセス

1. [Cloudflare Dashboard](https://dash.cloudflare.com)にログイン
2. 左サイドバーから「Workers & Pages」を選択
3. 該当のWorkerを選択

### 2. 環境変数の設定

1. 「Settings」タブを選択
2. 「Environment Variables」セクションを選択
3. 「Add variable」ボタンをクリック
4. 変数名と値を入力
5. 機密情報の場合は「Encrypt」にチェック
6. 「Save」をクリック

### 3. 環境別設定

各環境（Production、Preview、Development）に対して個別に設定可能です。

## Wrangler CLIでの設定

### シークレットの設定

```bash
# 対話形式でシークレットを設定
wrangler secret put TURSO_DATABASE_URL

# 環境を指定してシークレットを設定
wrangler secret put TURSO_DATABASE_URL --env production

# ファイルからシークレットを設定
echo "your-secret-value" | wrangler secret put TURSO_DATABASE_URL
```

### 通常の環境変数の設定

wrangler.tomlファイルで設定：

```toml
[vars]
CORS_ORIGIN = "https://saneatsu.me"

[env.development.vars]
CORS_ORIGIN = "http://localhost:3000"

[env.preview.vars]
CORS_ORIGIN = "https://preview.saneatsu.me"
```

## Tursoデータベースの設定

### 1. Tursoアカウント作成

```bash
# Turso CLIのインストール
curl -sSfL https://get.tur.so/install.sh | bash

# ログイン
turso auth login
```

### 2. データベース作成

```bash
# 本番用データベース
turso db create saneatsu-me

# プレビュー用データベース  
turso db create preview-saneatsu-me

# 開発用データベース
turso db create dev-saneatsu-me
```

### 3. 認証トークン生成

```bash
# 本番用
turso db tokens create saneatsu-me

# プレビュー用
turso db tokens create preview-saneatsu-me

# 開発用
turso db tokens create dev-saneatsu-me
```

### 4. データベースURL取得

```bash
# データベース情報表示
turso db show saneatsu-me
```

## CI/CDでの環境変数設定

### GitHub Actions

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy Backend
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: apps/backend
          secrets: |
            TURSO_DATABASE_URL
            TURSO_AUTH_TOKEN
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
```

### GitHub Secrets設定

以下のシークレットをGitHubリポジトリに設定：

- `CLOUDFLARE_API_TOKEN`: Cloudflare APIトークン
- `TURSO_DATABASE_URL`: Tursoデータベース URL
- `TURSO_AUTH_TOKEN`: Turso認証トークン

## セキュリティのベストプラクティス

### 1. シークレットの管理

- ⛔ **絶対にコードにハードコードしない**
- ✅ Cloudflareのシークレット機能を使用
- ✅ ローカル開発では.env.localファイル（.gitignoreに追加）

### 2. アクセス制御

- ✅ 最小権限の原則に従う
- ✅ 環境ごとに異なるトークンを使用
- ✅ 定期的なトークンローテーション

### 3. 監査とログ

- ✅ アクセスログの監視
- ✅ 異常なアクセスパターンの検出
- ✅ 定期的なセキュリティレビュー

## トラブルシューティング

### 環境変数が設定されない場合

```bash
# 現在の環境変数を確認
wrangler secret list

# 特定の環境の環境変数を確認
wrangler secret list --env production
```

### データベース接続エラー

1. TURSO_DATABASE_URLが正しいフォーマットか確認
2. TURSO_AUTH_TOKENが有効期限内か確認
3. Tursoデータベースが作成済みか確認

### CORS エラー

1. CORS_ORIGINが正しく設定されているか確認
2. フロントエンドのオリジンと一致しているか確認
3. プロトコル（http/https）が正しいか確認

## 参考リンク

- [Cloudflare Workers Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Turso Documentation](https://docs.turso.tech/)
- [Drizzle ORM with Turso](https://orm.drizzle.team/docs/get-started/turso)