---
sidebar_position: 1
---

# API概要

saneatsu.meのバックエンドAPIは、Honoフレームワークを使用して構築されたRESTful APIです。記事とタグの管理機能を提供し、多言語対応をサポートしています。

## ベースURL

```
開発環境: http://localhost:3333/api
本番環境: https://api.saneatsu.me/api (仮)
```

## 認証

現在のバージョンでは、公開APIに認証は必要ありません。将来的に管理機能が追加される際に、JWT認証が実装される予定です。

## レスポンス形式

すべてのAPIレスポンスはJSON形式で返されます。

### 成功レスポンス

```json
{
  "data": {
    // リソースデータ
  }
}
```

### エラーレスポンス

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーの説明"
  }
}
```

## エラーコード

| コード | 説明 |
|--------|------|
| `NOT_FOUND` | リソースが見つかりません |
| `DATABASE_ERROR` | データベース関連のエラー |
| `INTERNAL_SERVER_ERROR` | サーバー内部エラー |

## ステータスコード

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 404 | リソースが見つかりません |
| 500 | サーバーエラー |

## 言語サポート

APIは多言語対応しており、`lang`クエリパラメータで言語を指定できます：

- `ja` - 日本語（デフォルト）
- `en` - 英語

例：
```
GET /api/articles?lang=en
```

## ページネーション

一覧取得APIはページネーションをサポートしています：

| パラメータ | 型 | デフォルト | 説明 |
|------------|-----|------------|------|
| `page` | number | 1 | ページ番号 |
| `limit` | number | 10 | 1ページあたりのアイテム数 |

レスポンスには以下のページネーション情報が含まれます：

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 型安全性

APIはOpenAPIスペックを提供し、フロントエンドでの型安全な開発をサポートしています。Honoクライアントを使用することで、TypeScriptの型推論が利用できます。

```typescript
import { hc } from 'hono/client'
import type { AppType } from '@saneatsu/backend'

const client = hc<AppType>('http://localhost:3333')
const response = await client.api.articles.$get()
```