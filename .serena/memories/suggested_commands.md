# 開発コマンド一覧

## 基本コマンド

### 開発サーバー
```bash
# すべてのアプリケーションを起動
pnpm dev

# 個別アプリケーション起動
cd apps/web && pnpm dev          # フロントエンド（ポート3333）
cd apps/backend && pnpm dev       # バックエンド
cd apps/docs && pnpm dev          # ドキュメント

# Cloudflare Worker開発
pnpm dev:worker
```

### ビルド
```bash
# 通常ビルド
pnpm build

# Cloudflare用ビルド
pnpm build:cloudflare
```

### デプロイ
```bash
# 環境別デプロイ
pnpm deploy:dev       # 開発環境
pnpm deploy:preview   # プレビュー環境
pnpm deploy:prod      # 本番環境

# 環境設定
pnpm setup:env:dev    # 開発環境変数設定
pnpm setup:env:preview
pnpm setup:env:prod
```

## コード品質チェック

### 必須チェック（コミット前）
```bash
# Biomeチェック（lint + format）
pnpm check

# TypeScript型チェック
pnpm type-check

# 両方を実行（推奨）
pnpm check && pnpm type-check
```

### テスト
```bash
# ユニットテスト
pnpm test                         # すべて
cd apps/web && pnpm test         # webのみ
cd apps/backend && pnpm test     # backendのみ

# テストカバレッジ
pnpm test:coverage

# E2Eテスト
pnpm e2e                         # ヘッドレス実行
pnpm e2e:ui                      # UIモードで実行
pnpm e2e -- login.spec.ts       # 特定ファイルのみ

# Storybook
cd apps/web
pnpm storybook                   # 開発サーバー起動（ポート6666）
pnpm test-storybook             # Storybookテスト実行
pnpm build-storybook            # ビルド
```

## データベース

### Drizzle/Turso操作
```bash
# シード実行
pnpm seed
# または
cd packages/db && pnpm db:seed

# マイグレーション生成
cd packages/db && pnpm db:generate

# マイグレーション実行
cd packages/db && pnpm db:push

# Drizzle Studio起動
cd packages/db && pnpm db:studio
```

## Git操作

### 推奨フロー
```bash
# 変更をステージング
git add .

# Biomeでフォーマット（自動実行されるが手動でも可）
pnpm check --write

# 型チェック
pnpm type-check

# コミット（Lefthookが自動でチェック実行）
git commit -m "feat: Add new feature"
```

## システムユーティリティ（Darwin/macOS）

### 基本コマンド
```bash
# ファイル操作
ls -la              # 詳細リスト表示
find . -name "*.ts" # ファイル検索
grep -r "pattern" . # テキスト検索

# プロセス管理
ps aux | grep node  # Node.jsプロセス確認
kill -9 [PID]       # プロセス終了
lsof -i :3333       # ポート使用確認

# ネットワーク
curl http://localhost:3333  # HTTPリクエスト
dig example.com            # DNS確認

# 環境変数
echo $PATH                 # PATH確認
export VAR_NAME=value      # 環境変数設定
```

## トラブルシューティング

### ポートが使用中の場合
```bash
# ポート3333を使用しているプロセスを確認
lsof -i :3333

# プロセスを終了
kill -9 [PID]
```

### キャッシュクリア
```bash
# Turboキャッシュクリア
pnpm clean

# node_modules再インストール
rm -rf node_modules
pnpm install
```

### Biomeエラーの自動修正
```bash
# すべてのファイルを自動修正
pnpm check --write

# 特定ファイルのみ
pnpm exec biome check --write path/to/file.ts
```