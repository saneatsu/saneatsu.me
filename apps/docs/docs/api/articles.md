---
sidebar_position: 2
---

# 記事エンドポイント

記事の取得に関するAPIエンドポイントの詳細です。

## 記事一覧取得

公開済みの記事一覧を取得します。

### エンドポイント

```
GET /api/articles
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|------------|-----|------|------------|------|
| `page` | string | × | "1" | ページ番号 |
| `limit` | string | × | "10" | 1ページあたりの記事数 |
| `lang` | string | × | "ja" | 言語（ja/en） |

### レスポンス

#### 成功時 (200)

```json
{
  "data": [
    {
      "id": 1,
      "slug": "my-first-blog-post",
      "cfImageId": "image-id-5678",
      "status": "published",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "title": "私の最初のブログ記事",
      "content": "これは記事の本文です..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### エラー時 (500)

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch articles"
  }
}
```

### 使用例

```bash
# デフォルト設定で記事一覧を取得
curl http://localhost:3333/api/articles

# 英語の記事を20件ずつ取得
curl http://localhost:3333/api/articles?lang=en&limit=20

# 2ページ目を取得
curl http://localhost:3333/api/articles?page=2
```

## 記事詳細取得

指定されたスラッグの記事詳細を取得します。

### エンドポイント

```
GET /api/articles/:slug
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `slug` | string | ○ | 記事のスラッグ |

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|------------|-----|------|------------|------|
| `lang` | string | × | "ja" | 言語（ja/en） |

### レスポンス

#### 成功時 (200)

```json
{
  "data": {
    "id": 1,
    "slug": "my-first-blog-post",
    "cfImageId": "image-id-5678",
    "status": "published",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "title": "私の最初のブログ記事",
    "content": "これは記事の本文です..."
  }
}
```

#### 記事が見つからない場合 (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Article not found"
  }
}
```

#### エラー時 (500)

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch article"
  }
}
```

### 使用例

```bash
# 日本語の記事を取得
curl http://localhost:3333/api/articles/my-first-blog-post

# 英語の記事を取得
curl http://localhost:3333/api/articles/my-first-blog-post?lang=en
```

## TypeScript型定義

フロントエンドで使用できる型定義：

```typescript
interface Article {
  id: number;
  slug: string;
  cfImageId: string | null;
  status: string;
  publishedAt: string | null;
  title: string | null;
  content: string | null;
}

interface ArticlesResponse {
  data: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ArticleResponse {
  data: Article;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
```