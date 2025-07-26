---
sidebar_position: 3
---

# データベース管理

## 概要

このプロジェクトでは、Turso（Cloudベースの SQLite）を Drizzle ORM と組み合わせて使用しています。

## セットアップ

データベースのセットアップについては、[セットアップガイド](/docs/getting-started/setup)を参照してください。

## シードデータ

開発環境でテストデータを投入するためのシードスクリプトが用意されています。

### シードデータの実行方法

```bash
# ルートディレクトリから実行
pnpm -w seed

# または、packages/db ディレクトリから実行
cd packages/db
pnpm db:seed
```

### シードデータの内容

シードスクリプト（`packages/db/src/seed.ts`）は以下のデータを作成します：

#### ユーザー
- テストユーザー（test@example.com）

#### タグ（7種類）
- `tech` - 技術 / Technology
- `life` - ライフスタイル / Lifestyle
- `development` - 開発 / Development
- `web` - ウェブ / Web
- `database` - データベース / Database
- `ai` - AI・機械学習 / AI & ML
- `design` - デザイン / Design

#### 記事（12記事）
- **公開済み記事（10記事）**
  - Hello World（タグ: tech, development）
  - TypeScriptの便利なテクニック（タグ: tech, development）
  - 2024年の生活（タグ: life）
  - Next.js 15の新機能まとめ（タグ: tech, web, development）※画像付き
  - データベース設計のベストプラクティス（タグ: tech, database）※画像付き
  - AIを活用した開発効率化（タグ: tech, ai, development）※画像付き
  - モダンCSSテクニック（タグ: tech, web, design）
  - リモートワークを成功させるコツ（タグ: life）※画像付き
  - Webパフォーマンス最適化の実践（タグ: tech, web）※画像付き
  - デザインシステムの実装と運用（タグ: tech, design, development）※画像付き

- **下書き記事（2記事）**
  - React 19の新機能を先取り（タグ: tech, web, development）※画像付き
  - コーディング面接の準備方法（タグ: tech, development）

### シードデータの特徴

- **重複チェック**: 既存のデータがある場合は重複して作成されません
- **多言語対応**: すべての記事とタグに日本語・英語の翻訳が含まれています
- **画像付き記事**: 8記事に Cloudflare Images の ID が設定されています
- **日付の分散**: 2024年1月から10月まで、公開日時が分散されています
- **複数タグ対応**: 1つの記事に複数のタグを付けることができます

### データベースのリセット

完全にデータベースをリセットしてからシードデータを入れ直したい場合：

```bash
# データベースをリセット（注意：すべてのデータが削除されます）
pnpm db:push

# シードデータを投入
pnpm db:seed
```

## マイグレーション

スキーマ変更時のマイグレーション方法：

```bash
# マイグレーションファイルの生成
pnpm db:generate

# マイグレーションの実行
pnpm db:migrate
```

## Drizzle Studio

データベースの内容を GUI で確認・編集できます：

```bash
pnpm db:studio
```

ブラウザで `https://local.drizzle.studio` が開きます。