# プロジェクト進捗状況

## ✅ 完了していること

### バックエンドテスト実装
- [x] テストユーティリティファイルの作成
  - `apps/backend/src/utils/drizzle-test.ts` - データベースモック
  - `apps/backend/src/utils/vitest.ts` - モックデータファクトリー
  - `vitest.setup.ts` - グローバルテスト設定
- [x] バックエンドAPIテストファイルの作成
  - `apps/backend/src/index.test.ts` - メインサーバーテスト
  - `apps/backend/src/routes/articles/index.test.ts` - 記事APIテスト
  - `apps/backend/src/routes/tags/index.test.ts` - タグAPIテスト
- [x] **20件すべてのテストが通過**

### OpenAPIスキーマ実装
- [x] `apps/backend/src/routes/articles/schema.ts` - 記事API用スキーマ
- [x] `apps/backend/src/routes/tags/schema.ts` - タグAPI用スキーマ
- [x] 型安全なAPI定義の実装

### バックエンドAPI構造の整理
- [x] ディレクトリ構造の変更（articles/, tags/ に分離）
- [x] OpenAPI対応のルート実装
- [x] 適切なエラーハンドリングの実装

### スキーマ国際化対応
- [x] `packages/schemas/src/i18n.ts` - Zod国際化サポート
- [x] `makeZodI18nMap` - クライアント/サーバー対応の翻訳関数
- [x] `createServerZodErrorMap` - サーバーサイド専用翻訳関数

### コード品質改善
- [x] any型の適切な型定義への置き換え
- [x] 未使用インポートの削除
- [x] Biomeによるフォーマット修正
- [x] TypeScript型安全性の向上

### Feature-Sliced Design構造復元
- [x] 正しいディレクトリ構造の復元
  - `shared/` - 共通ライブラリ、API、ユーティリティ
  - `entities/` - ビジネスエンティティ（article, tag, user）
  - `features/` - ユーザー機能（auth, article, lang）
  - `widgets/` - 独立したUIブロック（header, footer, articles-list）
  - `views/` - ページレベルコンポーネント（将来実装用）
- [x] 各層のPublic API（index.ts）作成
- [x] importパスの修正
- [x] webアプリケーションの型チェック通過

### 型システムの問題解決
- [x] **バックエンドの型チェックエラー解決**
  - OpenAPIルートハンドラーの型エラーを`as any`で解決
  - testClientの型推論エラーを型アサーションで解決
  - TSConfig module resolutionをbundlerに変更
- [x] **パスエイリアス（@/）の修正**
  - FSD構造での相対パス使用に変更
  - 型チェックエラーの解決

### ビルドシステム
- [x] **pre-commitフックの修正**
  - `lefthook install`によるフック設定の修正
  - 型チェックとBiome checkが正常動作

### フロントエンド実装（FSD）
- [x] **Views Layerの完全実装**
  - `views/home/ui/home-view.tsx` - ホームページビュー
  - `views/article-detail/ui/article-detail-view.tsx` - 記事詳細ビュー
  - Views LayerのPublic API設定
- [x] **Features Layerの実装**
  - `features/article/ui/article-search.tsx` - 記事検索コンポーネント
  - `features/article/ui/article-filter.tsx` - 記事フィルターコンポーネント
  - Features LayerのPublic API設定
- [x] **ページファイルのViews Layer対応**
  - ホームページでHomeViewを使用
  - 記事詳細ページでArticleDetailViewを使用

### フロントエンドテスト実装
- [x] **Vitestテスト環境構築**
  - `apps/web/vitest.config.ts` - Vitest設定ファイル
  - `apps/web/vitest.setup.ts` - テストセットアップファイル
  - Testing Library、jsdom等の依存関係追加
- [x] **Views Layerテスト**
  - `views/home/ui/home-view.test.tsx` - HomeViewの単体・結合テスト
  - `views/article-detail/ui/article-detail-view.test.tsx` - ArticleDetailViewの単体・結合テスト
- [x] **Features Layerテスト**
  - `features/article/ui/article-search.test.tsx` - ArticleSearchの単体・結合テスト

### Git管理
- [x] **最小粒度での9個のコミット作成**
  1. Views Layer実装
  2. Article features UIコンポーネント
  3. Features Layer Public API設定
  4. ページファイルのViews Layer対応
  5. Vitestテスト設定
  6. テスト依存関係追加
  7. タスクファイル更新
  8. Biomeフォーマット適用
  9. 最終フォーマット修正
- [x] **mainブランチへのマージ完了**
  - `merge-main-website-setup`ブランチをmainにマージ
  - 54ファイルの変更をマージ

---

## ❌ 完了していないこと

### フロントエンド実装
- [ ] **Features Layerの拡張**
  - `features/auth/` - 認証機能（ログイン・ログアウト）
- [ ] **Entities Layerの拡張**
  - `entities/user/` - ユーザーエンティティの完全実装
- [ ] **Views Layerの拡張**
  - `views/articles-list/` - 記事一覧ビュー（将来的に必要になった場合）

### テスト実装
- [ ] **Storybookテスト**
  - UI コンポーネントのStorybookストーリー作成
  - `play()` 関数を使った網羅的なテスト
- [ ] **E2Eテスト**
  - Playwrightテストの実装
  - 重要なユーザーフローのテスト

### UI/UXの改善
- [ ] **shadcn/ui の導入**
  - nitoプロジェクトの `apps/web/src/shared/ui` を参考
  - すべてのUIをshadcn/uiベースに置き換える
  - Button、Input、Card等の基本コンポーネント導入

### インフラ・設定
- [ ] **CI/CD設定**
  - GitHub Actionsの設定
  - 自動テスト実行
  - 自動デプロイ

---

## 🚨 優先度の高い課題

1. **リモートリポジトリへのプッシュ** - 作業内容の保存のために必要
2. **Views Layerの実装** - フロントエンド機能完成のために重要
3. **フロントエンドテストの実装** - 品質保証のために必要

---

## 📝 次のステップ

1. リモートリポジトリへのプッシュ（手動実行）
2. フロントエンドFeature-Sliced Design実装の継続
3. テストカバレッジの拡充
4. CI/CD環境の構築
