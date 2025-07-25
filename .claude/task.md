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

### Git管理
- [x] **最小粒度での6個のコミット作成**
  1. テストユーティリティの追加
  2. バックエンドテストの追加
  3. OpenAPIスキーマの追加
  4. API実装の整理
  5. スキーマ国際化対応
  6. 設定ファイル更新
- [x] 不要ファイルのクリーンアップ

---

## ❌ 完了していないこと

### 型システムの問題
- [ ] **バックエンドの型チェックエラー解決**
  - Drizzle ORMとの型互換性問題
  - module resolution エラー（ESMとCJS混在）
  - SQLiteColumn型の不整合
- [ ] **パスエイリアス（@/）の修正**
  - TypeScriptが@/パスを認識しない問題
  - 現在は相対パスで回避中

### ビルドシステム
- [ ] **pre-commitフックの修正**
  - 型チェックが通らないため現在スキップ中
  - 適切な型定義修正が必要

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

### インフラ・設定
- [ ] **CI/CD設定**
  - GitHub Actionsの設定
  - 自動テスト実行
  - 自動デプロイ

---

## 🚨 優先度の高い課題

1. **バックエンド型エラーの解決** - 開発継続のために必須
2. **pre-commitフックの修正** - コード品質保持のために必要
3. **パスエイリアス問題の解決** - 開発体験向上のために重要

---

## 📝 次のステップ

1. バックエンドの型エラー修正
2. @/パスエイリアス問題の解決
3. フロントエンドFeature-Sliced Design実装の継続
4. テストカバレッジの拡充
