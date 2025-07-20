# 設計書

## 概要

Markdownブログシステムは、モノレポ構成でNext.js（フロントエンド）とHono（バックエンド）を使用したフルスタックWebアプリケーションです。Cloudflareインフラストラクチャを活用し、多言語対応とレスポンシブデザインを提供します。

## アーキテクチャ

### システム構成

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js)"]
        A[Web App]
        B[Admin Panel]
    end
    
    subgraph Backend["Backend (Hono)"]
        C[API Server]
        D[Auth Service]
    end
    
    subgraph Database["Database"]
        E[Drizzle ORM]
        F[Database]
    end
    
    subgraph External["External Services"]
        G[Google Auth]
        H[Cloudflare R2]
        I[Cloudflare CDN]
    end
    
    A --> C
    B --> C
    C --> E
    E --> F
    D --> G
    C --> H
    A --> I
    B --> I
```

### モノレポ構成

```
apps/
├── web/          # Next.js フロントエンド
├── backend/      # Hono API サーバー
packages/
├── db/           # Drizzle ORM設定
├── i18n/         # 国際化設定
```

## データモデル

### ERダイアグラム

```mermaid
erDiagram
    users {
        integer id PK
        string email
        string name
        string avatar_url
        string provider
        string provider_id
        datetime created_at
        datetime updated_at
    }
    
    articles {
        integer id PK
        string slug
        string cf_image_id
        enum status
        datetime published_at
        datetime created_at
        datetime updated_at
    }
    
    article_translations {
        integer id PK
        string title
        text content
        string language
        integer article_id FK
    }
    
    tags {
        integer id PK
        string slug
        datetime created_at
        datetime updated_at
    }
    
    tag_translations {
        integer id PK
        string name
        string language
        integer tag_id FK
    }
    
    article_tags {
        integer article_id FK
        integer tag_id FK
    }
    
    articles ||--o{ article_translations : "has"
    tags ||--o{ tag_translations : "has"
    articles ||--o{ article_tags : "has"
    tags ||--o{ article_tags : "belongs_to"
```

### データモデル詳細

#### Users テーブル
- `id`: ユーザーID（integer, auto increment）
- `email`: メールアドレス（unique）
- `name`: 表示名
- `avatar_url`: アバター画像URL
- `provider`: 認証プロバイダー（google）
- `provider_id`: プロバイダー固有ID
- `created_at`: 作成日時
- `updated_at`: 更新日時

#### Articles テーブル
- `id`: 記事ID（integer, auto increment）
- `slug`: URL用スラッグ（unique）
- `cf_image_id`: Cloudflare Images ID
- `status`: ステータス（enum: published, draft, archived）
- `published_at`: 公開日時
- `created_at`: 作成日時
- `updated_at`: 更新日時

#### Article_Translations テーブル
- `id`: 翻訳ID（integer, auto increment）
- `title`: 記事タイトル
- `content`: Markdown形式の本文
- `language`: 言語（ja, en）
- `article_id`: 記事ID（articles.id）
- 制約: (title, language) の組み合わせでユニーク

#### Tags テーブル
- `id`: タグID（integer, auto increment）
- `slug`: URL用スラッグ（unique）
- `created_at`: 作成日時
- `updated_at`: 更新日時

#### Tag_Translations テーブル
- `id`: 翻訳ID（integer, auto increment）
- `name`: タグ名
- `language`: 言語（ja, en）
- `tag_id`: タグID（tags.id）
- 制約: (name, language) の組み合わせでユニーク

#### Article_Tags テーブル（中間テーブル）
- `article_id`: 記事ID（articles.id）
- `tag_id`: タグID（tags.id）
- 複合主キー: (article_id, tag_id)

## コンポーネントとインターフェース

### API エンドポイント設計

#### 公開API
- `GET /api/articles` - 記事一覧取得
- `GET /api/articles/:slug` - 記事詳細取得
- `GET /api/tags` - タグ一覧取得
- `GET /api/tags/:slug/articles` - タグ別記事一覧

#### 管理API（認証必須）
- `POST /api/auth/google` - Google認証
- `GET /api/admin/articles` - 管理用記事一覧
- `POST /api/admin/articles` - 記事作成
- `PUT /api/admin/articles/:id` - 記事更新
- `DELETE /api/admin/articles/:id` - 記事削除
- `GET /api/admin/tags` - 管理用タグ一覧
- `POST /api/admin/tags` - タグ作成
- `PUT /api/admin/tags/:id` - タグ更新
- `DELETE /api/admin/tags/:id` - タグ削除
- `POST /api/admin/upload` - 画像アップロード

## シーケンス図

### 記事閲覧フロー

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant A as API Server
    participant D as Database
    participant C as Cloudflare CDN
    
    U->>W: トップページアクセス
    W->>A: GET /api/articles?page=1
    A->>D: 記事一覧クエリ実行
    D-->>A: 記事データ返却
    A-->>W: JSON レスポンス
    W->>C: サムネイル画像リクエスト
    C-->>W: 最適化された画像
    W-->>U: 記事一覧表示
```

### 記事作成フロー

```mermaid
sequenceDiagram
    participant A as Admin
    participant W as Admin Panel
    participant API as API Server
    participant Auth as Auth Service
    participant CI as Cloudflare Images
    participant D as Database
    
    A->>W: 記事作成ページアクセス
    W->>API: 認証状態確認
    API->>Auth: トークン検証
    Auth-->>API: 認証結果
    API-->>W: 認証OK
    
    A->>W: 記事フォーム入力
    A->>W: サムネイル画像選択
    W->>API: POST /api/admin/upload
    API->>CI: 画像アップロード
    CI-->>API: 画像ID返却（複数サイズ自動生成）
    API-->>W: 画像ID返却
    
    A->>W: 記事保存実行
    W->>API: POST /api/admin/articles
    API->>D: 記事データ保存
    API->>D: タグ関連付け保存
    D-->>API: 保存完了
    API-->>W: 作成成功
    W-->>A: 成功メッセージ表示
```

### Google認証フロー

```mermaid
sequenceDiagram
    participant A as Admin
    participant W as Web App
    participant API as API Server
    participant G as Google OAuth
    participant D as Database
    
    A->>W: ログインページアクセス
    W-->>A: Google認証ボタン表示
    A->>W: Google認証ボタンクリック
    W->>G: OAuth認証リクエスト
    G-->>A: Google認証画面表示
    A->>G: 認証情報入力
    G->>W: 認証コード返却
    W->>API: POST /api/auth/google
    API->>G: アクセストークン取得
    G-->>API: ユーザー情報返却
    API->>D: ユーザー情報保存/更新
    D-->>API: 保存完了
    API-->>W: JWTトークン返却
    W-->>A: 管理画面リダイレクト
```

## エラーハンドリング

### エラーレスポンス形式

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

### エラーコード定義

- `AUTH_001`: 認証が必要
- `AUTH_002`: 認証トークンが無効
- `AUTH_003`: 権限が不足
- `VALIDATION_001`: バリデーションエラー
- `NOT_FOUND_001`: リソースが見つからない
- `UPLOAD_001`: ファイルアップロードエラー
- `DATABASE_001`: データベースエラー

## テスト戦略

### テストピラミッド

1. **単体テスト（Vitest）**
   - ユーティリティ関数
   - バリデーション関数
   - データ変換関数

2. **コンポーネントテスト（Storybook + Vitest）**
   - UIコンポーネント
   - フォームコンポーネント
   - レイアウトコンポーネント

3. **統合テスト（Vitest）**
   - API エンドポイント
   - データベース操作
   - 認証フロー

4. **E2Eテスト（Playwright）**
   - ユーザージャーニー
   - 管理者ワークフロー
   - 多言語切り替え

### テストデータ戦略

- テスト用データベースの使用
- ファクトリーパターンでテストデータ生成
- モックサービスの活用（画像アップロード等）

## セキュリティ考慮事項

### 認証・認可
- JWT トークンベース認証
- CSRF 保護
- CORS 設定

### データ保護
- 入力値サニタイゼーション
- SQLインジェクション対策（Drizzle ORM使用）
- XSS対策

### ファイルアップロード
- ファイルタイプ検証
- ファイルサイズ制限
- 安全なファイル名生成

## UI設計と画面遷移

### 画面遷移図

```mermaid
graph TD
    A[トップページ /] --> B[記事詳細 /articles/:slug]
    A --> C[ブログ一覧 /blog]
    A --> AB[About /about]
    C --> B
    A --> D[タグ一覧 /tags]
    D --> E[タグ別記事一覧 /tags/:slug]
    E --> B
    
    A --> F[ログイン /login]
    F --> G[管理画面 /admin]
    
    G --> H[記事一覧 /admin/articles]
    H --> I[記事新規作成 /admin/articles/new]
    H --> J[記事編集 /admin/articles/:id]
    
    G --> K[タグ一覧 /admin/tags]
    K --> L[タグ新規作成 /admin/tags/new]
    K --> M[タグ編集 /admin/tags/:id]
    
    I --> H
    J --> H
    L --> K
    M --> K
```

### ワイヤーフレーム

#### 1. トップページ（/）

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] [Blog] [About]     [🌙 Theme] [🌐 Locale] [Tags]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 最新記事                                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────┐  ┌─────────────────────────────────────────┐   │
│  │[サムネイル]│  │ 記事タイトル                            │   │
│  │          │  │ 公開日: 2024-01-01                     │   │
│  │          │  │ タグ: [JavaScript] [React] [Next.js]   │   │
│  └──────────┘  │ 記事の概要テキスト...                   │   │
│                └─────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────┐  ┌─────────────────────────────────────────┐   │
│  │[サムネイル]│  │ 記事タイトル2                           │   │
│  │          │  │ 公開日: 2024-01-02                     │   │
│  │          │  │ タグ: [TypeScript] [Node.js]           │   │
│  └──────────┘  │ 記事の概要テキスト...                   │   │
│                └─────────────────────────────────────────┘   │
│                                                             │
│              [← 前のページ] [1] [2] [3] [次のページ →]        │
└─────────────────────────────────────────────────────────────┘
```

#### 2. 記事詳細ページ（/articles/:slug）

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] [Blog] [About]     [🌙 Theme] [🌐 Locale] [Tags]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   [サムネイル画像]                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  記事タイトル                                               │
│  公開日: 2024-01-01                                        │
│  タグ: [JavaScript] [React] [Next.js]                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  # 見出し1                                              │ │
│  │                                                         │ │
│  │  記事の本文がMarkdownで表示されます。                   │ │
│  │                                                         │ │
│  │  ## 見出し2                                             │ │
│  │                                                         │ │
│  │  - リスト項目1                                          │ │
│  │  - リスト項目2                                          │ │
│  │                                                         │ │
│  │  ```javascript                                          │ │
│  │  console.log('Hello World');                            │ │
│  │  ```                                                    │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  [← トップページに戻る]                                     │
└─────────────────────────────────────────────────────────────┘
```

#### 3. タグ一覧ページ（/tags）

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] [Blog] [About]     [🌙 Theme] [🌐 Locale] [Tags]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ タグ一覧                                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [JavaScript] (12記事)                                   │ │
│  │ [React] (8記事)                                         │ │
│  │ [Next.js] (6記事)                                       │ │
│  │ [TypeScript] (10記事)                                   │ │
│  │ [Node.js] (5記事)                                       │ │
│  │ [CSS] (7記事)                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  [← トップページに戻る]                                     │
└─────────────────────────────────────────────────────────────┘
```

#### 4. 管理画面 - 記事一覧（/admin/articles）

```
┌─────────────────────────────────────────────────────────────┐
│ 管理画面                                      [ログアウト]   │
├─────────────────────────────────────────────────────────────┤
│ [記事管理] [タグ管理]                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  記事一覧                              [+ 新規記事作成]     │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ サムネイル │ タイトル    │ タグ      │ ステータス │ 操作 │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ [画像]     │ 記事1      │ JS, React │ 公開済み   │ 編集 │ │
│  │ [画像]     │ 記事2      │ TS        │ 下書き     │ 編集 │ │
│  │ [画像]     │ 記事3      │ CSS       │ アーカイブ │ 編集 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│              [← 前のページ] [1] [2] [3] [次のページ →]        │
└─────────────────────────────────────────────────────────────┘
```

#### 5. 管理画面 - 記事作成/編集（/admin/articles/new）

```
┌─────────────────────────────────────────────────────────────┐
│ 管理画面                                      [ログアウト]   │
├─────────────────────────────────────────────────────────────┤
│ [記事管理] [タグ管理]                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  記事作成                                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ サムネイル画像                                          │ │
│  │ [ファイル選択] [アップロード]                           │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ [プレビュー画像]                                    │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ タイトル (日本語)                                       │ │
│  │ [                                                     ] │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ タイトル (English)                                      │ │
│  │ [                                                     ] │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ タグ                                                    │ │
│  │ [JavaScript ×] [React ×] [+ タグを追加]                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 本文 (日本語) - Markdown                                │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ # 見出し                                            │ │ │
│  │ │                                                     │ │ │
│  │ │ 本文をMarkdownで入力...                             │ │ │
│  │ │                                                     │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 本文 (English) - Markdown                               │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ # Heading                                           │ │ │
│  │ │                                                     │ │ │
│  │ │ Content in Markdown...                              │ │ │
│  │ │                                                     │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ステータス: [公開済み ▼] [下書き保存] [公開]               │
│                                                             │
│  [キャンセル] [プレビュー] [保存]                           │
└─────────────────────────────────────────────────────────────┘
```

### レスポンシブデザイン考慮事項

#### モバイル表示（768px以下）

- ヘッダーはハンバーガーメニューに変更
- 記事一覧は1カラム表示
- サムネイル画像は上部に配置
- 管理画面のテーブルはカード形式に変更
- タッチフレンドリーなボタンサイズ

#### タブレット表示（768px-1024px）

- 2カラムレイアウト
- サイドバーの表示/非表示切り替え
- 適度な余白とパディング

### UI コンポーネント設計

#### 共通コンポーネント
- Header（ナビゲーション、言語切り替え、テーマ切り替え）
- Footer
- Button（Primary, Secondary, Danger）
- Card（記事カード、タグカード）
- Modal（確認ダイアログ）
- Loading（スピナー、スケルトン）

#### フォームコンポーネント
- Input（テキスト、メール、パスワード）
- Textarea（Markdown エディタ）
- Select（ドロップダウン）
- FileUpload（画像アップロード）
- TagSelector（タグ選択）

#### 記事表示コンポーネント
- ArticleCard（記事一覧用）
- ArticleContent（Markdown レンダリング）
- TagList（タグ一覧表示）
- Pagination（ページネーション）

## パフォーマンス最適化

### フロントエンド
- Next.js の静的生成活用
- 画像最適化（next/image）
- コード分割
- キャッシュ戦略

### バックエンド
- データベースインデックス最適化
- クエリ最適化
- レスポンスキャッシュ

### インフラ
- Cloudflare CDN活用
- 画像配信最適化
- 地理的分散
