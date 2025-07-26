---
sidebar_position: 3
---

# タグエンドポイント

タグの取得に関するAPIエンドポイントの詳細です。

## タグ一覧取得

全てのタグとそれぞれの記事数を取得します。

### エンドポイント

```
GET /api/tags
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|------------|-----|------|------------|------|
| `lang` | string | × | "ja" | 言語（ja/en） |

### レスポンス

#### 成功時 (200)

```json
{
  "data": [
    {
      "id": 1,
      "slug": "javascript",
      "name": "JavaScript",
      "articleCount": 15
    },
    {
      "id": 2,
      "slug": "react",
      "name": "React",
      "articleCount": 10
    }
  ]
}
```

#### エラー時 (500)

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch tags"
  }
}
```

### 使用例

```bash
# 日本語のタグ一覧を取得
curl http://localhost:3333/api/tags

# 英語のタグ一覧を取得
curl http://localhost:3333/api/tags?lang=en
```

## タグ別記事一覧取得

指定されたタグに紐づく記事一覧を取得します。

### エンドポイント

```
GET /api/tags/:slug/articles
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `slug` | string | ○ | タグのスラッグ |

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
      "slug": "javascript-basics",
      "cfImageId": "image-id-1234",
      "status": "published",
      "publishedAt": "2024-01-15T00:00:00.000Z",
      "title": "JavaScriptの基礎",
      "content": "JavaScriptの基本について説明します..."
    },
    {
      "id": 3,
      "slug": "modern-javascript",
      "cfImageId": "image-id-5678",
      "status": "published",
      "publishedAt": "2024-02-01T00:00:00.000Z",
      "title": "モダンJavaScript入門",
      "content": "ES6以降の機能について..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

#### タグが見つからない場合 (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Tag not found"
  }
}
```

#### エラー時 (500)

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch tag articles"
  }
}
```

### 使用例

```bash
# JavaScriptタグの記事一覧を取得
curl http://localhost:3333/api/tags/javascript/articles

# Reactタグの英語記事を取得（2ページ目、20件ずつ）
curl http://localhost:3333/api/tags/react/articles?lang=en&page=2&limit=20
```

## TypeScript型定義

フロントエンドで使用できる型定義：

```typescript
interface Tag {
  id: number;
  slug: string;
  name: string;
  articleCount: number;
}

interface TagsResponse {
  data: Tag[];
}

interface TagArticle {
  id: number;
  slug: string;
  cfImageId: string | null;
  status: string;
  publishedAt: string | null;
  title: string | null;
  content: string | null;
}

interface TagArticlesResponse {
  data: TagArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## 注意事項

- タグに紐づく記事は公開済み（`status: "published"`）のもののみが返されます
- 記事数（`articleCount`）は公開済みの記事のみをカウントします
- タグが存在しても、紐づく公開記事がない場合は`articleCount`が0になります