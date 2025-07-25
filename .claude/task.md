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

### Git管理
- [x] **最小粒度での5個のコミット作成**
  1. バックエンド型エラー修正
  2. 古いFSD構造ファイル削除
  3. ページファイルのFSD対応修正
  4. 新しいFSD構造追加
  5. タスクファイル追加
  6. Biomeフォーマット修正
- [x] **mainブランチへのマージ完了**
  - `merge-main-website-setup`ブランチをmainにマージ
  - 54ファイルの変更をマージ

---

## ❌ 完了していないこと

### フロントエンド実装
- [ ] **Views Layerの実装**
  - `views/home/` - ホームページビュー
  - `views/article-detail/` - 記事詳細ビュー
  - `views/articles-list/` - 記事一覧ビュー
- [ ] **Features Layerの実装**
  - `features/auth/` - 認証機能
  - `features/article/` - 記事関連機能
- [ ] **Entities Layerの拡張**
  - `entities/user/` - ユーザーエンティティ

### テスト実装
- [ ] **フロントエンドテスト**
  - React Testingライブラリを使った単体テスト
  - Storybookコンポーネントテスト
- [ ] **E2Eテスト**
  - Playwrightテストの実装
  - 重要なユーザーフローのテスト

### shadcn/ui の導入
nitoプロジェクトの apps/web/src/shared/ui を参考にすること。

- [ ] すべてのUIをshadcn/uiベースに置き換える

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
