# @saneatsu/db

データベーススキーマとユーティリティのパッケージ

## 📋 概要

このパッケージは、saneatsu.meプロジェクトのデータベース関連の機能を提供します：

- Drizzle ORMを使用したスキーマ定義
- Turso (SQLite) データベースとの接続
- マイグレーション管理
- シードデータの投入
- Drizzle Studioによるデータベース管理

## 🗂️ テーブル構造

### articles（記事）
- `id`: 記事ID
- `slug`: URLスラッグ
- `status`: ステータス（draft, published, archived）
- `cf_image_id`: Cloudflare Images ID
- `published_at`: 公開日時
- `created_at`: 作成日時
- `updated_at`: 更新日時

### article_translations（記事翻訳）
- `id`: 翻訳ID
- `article_id`: 記事ID（外部キー）
- `language`: 言語コード（ja, en）
- `title`: タイトル
- `content`: 本文（Markdown）
- `view_count`: 閲覧数
- `created_at`: 作成日時
- `updated_at`: 更新日時

### tags（タグ）
- `id`: タグID
- `slug`: URLスラッグ（ユニーク）
- `created_at`: 作成日時

### article_tags（記事-タグ関連）
- `article_id`: 記事ID
- `tag_id`: タグID

### users（ユーザー）
- `id`: ユーザーID
- `email`: メールアドレス
- `name`: 名前
- `created_at`: 作成日時
- `updated_at`: 更新日時

## 🔧 Drizzle Studio 詳細ガイド

### 起動と接続

```bash
# このディレクトリから起動
pnpm db:studio

# 環境変数を指定して起動（本番DB接続時）
TURSO_DATABASE_URL=libsql://production.turso.io \
TURSO_AUTH_TOKEN=your-prod-token \
pnpm db:studio
```

### GUI操作ガイド

#### 1. データの閲覧
- 左サイドバーからテーブルを選択
- フィルター機能で特定のデータを検索
- カラムヘッダーをクリックしてソート

#### 2. データの追加
- テーブル画面で「+ Add row」ボタンをクリック
- 必要なフィールドを入力
- 「Save」で保存

#### 3. データの編集
- 編集したい行をクリック
- フィールドを直接編集
- 自動的に保存される

#### 4. データの削除
- 削除したい行を選択
- 「Delete」ボタンをクリック
- 確認ダイアログで「Confirm」

#### 5. SQL実行
- 上部の「SQL runner」タブをクリック
- SQLクエリを入力
- 「Run」ボタンで実行

### 実用的なSQLクエリ集

#### 記事管理

```sql
-- 記事の統計情報を取得
SELECT 
  status,
  COUNT(*) as count
FROM articles
GROUP BY status;

-- 人気記事トップ10（日本語）
SELECT 
  a.id,
  a.slug,
  at.title,
  at.view_count
FROM articles a
JOIN article_translations at ON a.id = at.article_id
WHERE at.language = 'ja'
ORDER BY at.view_count DESC
LIMIT 10;

-- タグ別の記事数
SELECT 
  t.slug as tag,
  COUNT(DISTINCT atg.article_id) as article_count
FROM tags t
LEFT JOIN article_tags atg ON t.id = atg.tag_id
GROUP BY t.id, t.slug
ORDER BY article_count DESC;

-- 未翻訳の記事を探す
SELECT 
  a.id,
  a.slug,
  ja.title as japanese_title
FROM articles a
JOIN article_translations ja ON a.id = ja.article_id AND ja.language = 'ja'
LEFT JOIN article_translations en ON a.id = en.article_id AND en.language = 'en'
WHERE en.id IS NULL;
```

#### データメンテナンス

```sql
-- 古い下書き記事を確認（30日以上前）
SELECT * FROM articles 
WHERE status = 'draft' 
AND updated_at < datetime('now', '-30 days');

-- 使用されていないタグを探す
SELECT t.* 
FROM tags t
LEFT JOIN article_tags at ON t.id = at.tag_id
WHERE at.tag_id IS NULL;

-- 重複スラッグをチェック
SELECT slug, COUNT(*) as count
FROM articles
GROUP BY slug
HAVING count > 1;
```

#### データ更新

```sql
-- 特定記事のステータスを変更
UPDATE articles 
SET status = 'published', 
    published_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'your-article-slug';

-- 全記事の閲覧数をリセット
UPDATE article_translations 
SET view_count = 0;

-- タグの一括置換
UPDATE article_tags 
SET tag_id = (SELECT id FROM tags WHERE slug = 'new-tag')
WHERE tag_id = (SELECT id FROM tags WHERE slug = 'old-tag');
```

## 🔄 マイグレーション

### マイグレーション生成

```bash
# スキーマ変更後、マイグレーションファイルを生成
pnpm db:generate
```

### マイグレーション適用

```bash
# 開発環境へ適用
pnpm db:push

# 本番環境へ適用（環境変数を設定）
TURSO_DATABASE_URL=libsql://production.turso.io \
TURSO_AUTH_TOKEN=your-prod-token \
pnpm db:migrate
```

## 🌱 シードデータ

### シード実行

```bash
# 開発用のサンプルデータを投入
pnpm db:seed

# または
pnpm seed
```

### シードデータの内容

- サンプル記事（日本語・英語）
- よく使うタグ
- テストユーザー

## 🐛 トラブルシューティング

### Drizzle Studioが起動しない

1. 環境変数を確認
```bash
echo $TURSO_DATABASE_URL
echo $TURSO_AUTH_TOKEN
```

2. .envファイルの存在を確認
```bash
ls -la .env
```

3. ポート4983が使用されていないか確認
```bash
lsof -i :4983
```

### データベース接続エラー

1. Turso CLIでデータベースの状態を確認
```bash
turso db show your-database-name
```

2. 認証トークンの再生成
```bash
turso db tokens create your-database-name
```

### マイグレーションエラー

1. マイグレーション履歴を確認
```sql
SELECT * FROM __drizzle_migrations;
```

2. 必要に応じてロールバック
```bash
# 手動でSQLを実行してロールバック
turso db shell your-database-name
```

## 📚 関連ドキュメント

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Turso Documentation](https://docs.turso.tech/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## 🔒 セキュリティ注意事項

- 本番環境のデータベースへの直接アクセスは慎重に行う
- SQLインジェクション対策としてパラメータ化クエリを使用
- 環境変数は絶対にコミットしない
- バックアップを定期的に取得

## 💡 ベストプラクティス

1. **開発時のワークフロー**
   - 常にローカルDBで変更をテスト
   - マイグレーションは段階的に適用
   - 本番適用前にバックアップを取得

2. **パフォーマンス最適化**
   - インデックスを適切に設定
   - N+1問題を避ける
   - 不要なデータは定期的に削除

3. **データ整合性**
   - 外部キー制約を活用
   - トランザクションで複数テーブル更新
   - 定期的にデータ整合性をチェック