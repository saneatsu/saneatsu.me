---
sidebar_position: 1
---

# 開発環境セットアップ

このガイドでは、saneatsu.meプロジェクトの開発環境をセットアップする方法を説明します。

## 前提条件

開発を始める前に、以下のツールがインストールされていることを確認してください：

### 必須ツール

- **Node.js** (v20.0.0以上)
  - 推奨: [fnm](https://github.com/Schniz/fnm) または [nvm](https://github.com/nvm-sh/nvm) を使用したバージョン管理
- **pnpm** (v9.0.0以上)
  ```bash
  npm install -g pnpm@latest
  ```
- **Git**
- **Visual Studio Code** (推奨エディタ)

### データベース

- **Turso CLI** (データベース管理用)
  ```bash
  curl -sSfL https://get.tur.so/install.sh | bash
  ```

## リポジトリのクローン

```bash
git clone https://github.com/saneatsu/saneatsu.me.git
cd saneatsu.me
```

## 依存関係のインストール

プロジェクトはpnpmワークスペースを使用したモノレポ構成です：

```bash
# すべての依存関係をインストール
pnpm install
```

## 環境変数の設定

### 1. バックエンド環境変数

`apps/backend/.env`ファイルを作成：

```bash
cp apps/backend/.env.example apps/backend/.env
```

必要な環境変数を設定：

```env
# API Server Configuration
PORT=3333

# Turso Database Configuration
TURSO_DATABASE_URL="your-turso-database-url"
TURSO_AUTH_TOKEN="your-turso-auth-token"

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Secret (for authentication)
JWT_SECRET=your-secret-key-here
```

### 2. フロントエンド環境変数

`apps/frontend/.env.local`ファイルを作成：

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

必要な環境変数を設定：

```env
# Backend API URL
BACKEND_URL=http://localhost:3333
```

## データベースのセットアップ

### 1. Tursoデータベースの作成

```bash
# Tursoにログイン
turso auth login

# データベースを作成
turso db create saneatsu-blog

# 接続情報を取得
turso db show saneatsu-blog --url
turso db tokens create saneatsu-blog
```

### 2. データベースマイグレーション

```bash
# データベーススキーマを適用
pnpm db:push

# 開発用シードデータを投入（オプション）
pnpm db:seed
```

## 開発サーバーの起動

すべてのアプリケーションを同時に起動：

```bash
pnpm dev
```

これにより以下のサービスが起動します：

- **フロントエンド** (Next.js): http://localhost:3000
- **バックエンドAPI** (Hono): http://localhost:3333
- **ドキュメント** (Docusaurus): http://localhost:3210

個別に起動する場合：

```bash
# フロントエンドのみ
pnpm --filter @saneatsu/frontend dev

# バックエンドのみ
pnpm --filter @saneatsu/backend dev

# ドキュメントのみ
pnpm --filter @saneatsu/docs start
```

## 開発ツールのセットアップ

### VSCode拡張機能

推奨される拡張機能をインストール：

1. **Biome** - コードフォーマッターとリンター
2. **Tailwind CSS IntelliSense** - Tailwind CSSの補完
3. **Prisma** - Prismaスキーマのシンタックスハイライト（Drizzleでも有用）
4. **Error Lens** - エラーをインラインで表示

### Biomeの設定

プロジェクトではBiomeを使用してコードフォーマットとリンティングを行います：

```bash
# フォーマットチェック
pnpm check

# 自動修正
pnpm check --write

# 型チェック
pnpm type-check
```

## 開発フロー

### 1. ブランチの作成

```bash
git checkout -b feature/your-feature-name
```

### 2. 開発とテスト

```bash
# 開発サーバーを起動
pnpm dev

# テストの実行
pnpm test

# 型チェック
pnpm type-check

# リント&フォーマット
pnpm check --write
```

### 3. コミット

Conventional Commitsに従ってコミット：

```bash
git add .
git commit -m "feat: 新機能の追加"
```

## トラブルシューティング

### ポートが既に使用されている場合

```bash
# 使用中のポートを確認
lsof -i :3000  # フロントエンド
lsof -i :3333  # バックエンド

# プロセスを終了
kill -9 <PID>
```

### 依存関係の問題

```bash
# キャッシュをクリア
pnpm store prune

# node_modulesを削除して再インストール
rm -rf node_modules
rm -rf apps/*/node_modules packages/*/node_modules
pnpm install
```

### TypeScriptエラー

```bash
# 型定義を再生成
pnpm type-check

# IDEを再起動
# VSCodeの場合: Cmd/Ctrl + Shift + P → "Developer: Reload Window"
```

## 次のステップ

- [アーキテクチャ概要](/docs/architecture/overview)を読んで、プロジェクト構造を理解する
- [コーディング規約](/docs/development/coding-standards)を確認する
- [APIドキュメント](/docs/api/overview)でエンドポイントを確認する