---
sidebar_position: 2
---

# CI/CD パイプライン

GitHub ActionsとCloudflare Workersを使用した継続的インテグレーション・デプロイメントの設定です。

## GitHub Actions ワークフロー

### プルリクエスト時のチェック

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - run: pnpm check
      
      - run: pnpm type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - name: Run unit tests
        run: pnpm test:unit
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  storybook-test:
    name: Storybook Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - name: Build Storybook
        run: pnpm --filter @saneatsu/web build-storybook
        
      - name: Run Storybook tests
        run: pnpm --filter @saneatsu/web test-storybook

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps
        
      - name: Build application
        run: pnpm build
        
      - name: Run E2E tests
        run: pnpm e2e
        
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - name: Build all packages
        run: pnpm build
        
      - name: Check build output
        run: |
          if [ ! -d "apps/web/.next" ]; then
            echo "Build failed: .next directory not found"
            exit 1
          fi
```

### デプロイ前のデータベースマイグレーション

`.github/workflows/migrate.yml`:

```yaml
name: Database Migration

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - 'packages/db/drizzle/**'

jobs:
  migrate:
    name: Run migrations
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - name: Run migrations
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
        run: pnpm db:migrate:deploy
```

## Cloudflare Workers デプロイ設定

### wranglerによる自動デプロイ

Cloudflare Workersへのデプロイは、GitHub Actionsとwranglerを使用して自動化されています。

### デプロイワークフローの例

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Build for Cloudflare
        run: pnpm build:cloudflare

      - name: Deploy to Cloudflare Workers
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: pnpm wrangler deploy --env production
```

## 環境別の設定

### 開発環境

```yaml
# .github/workflows/dev-deploy.yml
name: Deploy to Development

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Build for Cloudflare
        run: pnpm build:cloudflare

      - name: Deploy to Development
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: pnpm wrangler deploy --env dev
```

### ステージング環境

```yaml
# .github/workflows/staging-deploy.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Build for Cloudflare
        run: pnpm build:cloudflare

      - name: Deploy to Staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: pnpm wrangler deploy --env preview
```

## リリース自動化

### セマンティックリリース

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - uses: pnpm/action-setup@v2
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - name: Create Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: pnpm exec semantic-release
```

### リリースノートの自動生成

`.releaserc.json`:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/github",
    "@semantic-release/git"
  ]
}
```

## 品質ゲート

### 必須チェック項目

PRマージ前に以下のチェックが必須：

1. **コード品質**
   - Biomeによるリント
   - TypeScriptの型チェック

2. **テスト**
   - 単体テストのパス
   - カバレッジ80%以上
   - Storybookテストのパス
   - E2Eテストのパス

3. **ビルド**
   - 本番ビルドの成功

### ブランチ保護ルール

```yaml
# GitHub Branch Protection Rules
- Require pull request reviews before merging
- Dismiss stale pull request approvals
- Require review from CODEOWNERS
- Require status checks to pass
- Require branches to be up to date
- Include administrators
```

## 通知設定

### Slack通知

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment failed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### メール通知

GitHub Actionsの設定で失敗時のメール通知を有効化

## トラブルシューティング

### よくある問題と解決方法

1. **キャッシュの問題**
   ```yaml
   - name: Clear cache
     run: |
       rm -rf node_modules
       rm -rf .next
       pnpm store prune
   ```

2. **環境変数の不足**
   - GitHub Secretsを確認
   - Cloudflare Worker Secretsを確認
   - wrangler.tomlの環境変数設定を確認

3. **タイムアウト**
   ```yaml
   jobs:
     build:
       timeout-minutes: 30  # タイムアウトを延長
   ```

## ベストプラクティス

1. **並列実行**
   - 独立したジョブは並列実行
   - 依存関係は`needs`で制御

2. **キャッシュの活用**
   - node_modulesのキャッシュ
   - ビルドキャッシュの活用

3. **失敗時の対応**
   - アーティファクトの保存
   - 詳細なログ出力
   - リトライ機構の実装
