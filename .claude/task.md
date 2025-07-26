# プロジェクト進捗状況

## 📊 現在の状態
- **総コミット数**: 48個（mainブランチより先）
- **主な実装**: バックエンドAPI、フロントエンド基盤、テスト環境、国際化、Tailwind CSS v4
- **現在の課題**: スタイリングが適用されていない（開発サーバーの再起動が必要）

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

### Storybookテスト実装
- [x] **Storybook環境構築**
  - `apps/web/.storybook/main.ts` - Storybook設定ファイル
  - `apps/web/.storybook/preview.tsx` - NextIntlClientProvider設定
  - Storybook 9.0.18とNext.js統合
  - @storybook/testによるplay関数サポート
- [x] **Features LayerのStorybook**
  - `features/article/ui/article-search.stories.tsx` - 検索機能の包括的テスト
  - `features/article/ui/article-filter.stories.tsx` - フィルター機能の包括的テスト
  - バリデーション、ユーザーインタラクション、状態管理テスト
- [x] **Views LayerのStorybook**
  - `views/home/ui/home-view.stories.tsx` - ヒーローセクション・セマンティック構造テスト
  - `views/article-detail/ui/article-detail-view.stories.tsx` - Markdownレンダリング・国際化テスト
  - アクセシビリティ、レスポンシブデザインテスト
- [x] **国際化・翻訳対応**
  - `packages/i18n/src/locales/ja.json` - 検索・フィルター用日本語翻訳
  - `packages/i18n/src/locales/en.json` - 検索・フィルター用英語翻訳

### Git管理
- [x] **最小粒度での9個のコミット作成（フロントエンド実装）**
  1. Views Layer実装
  2. Article features UIコンポーネント
  3. Features Layer Public API設定
  4. ページファイルのViews Layer対応
  5. Vitestテスト設定
  6. テスト依存関係追加
  7. タスクファイル更新
  8. Biomeフォーマット適用
  9. 最終フォーマット修正
- [x] **最小粒度での5個のコミット作成（Storybookテスト実装）**
  1. 翻訳ファイルの更新 - 検索・フィルター関連の日英翻訳追加
  2. Storybookの設定と初期化 - Next.js統合とNextIntlClientProvider設定
  3. Features LayerのStorybook - ArticleSearchとArticleFilterの包括的テスト
  4. Views LayerのStorybook - HomeViewとArticleDetailViewのテスト
  5. 設定ファイル更新 - Vitestコンフィグとその他の設定
- [x] **mainブランチへのマージ完了**
  - `merge-main-website-setup`ブランチをmainにマージ
  - 54ファイルの変更をマージ
- [x] **合計14個のコミットによる段階的実装**
  - フロントエンド機能とStorybookテストの完全実装

### 開発環境の改善
- [x] **TypeScriptコンパイラーのログ保持**
  - `--preserveWatchOutput`フラグを追加してコンソールログが消えない問題を解決
- [x] **APIポート設定の修正**
  - フロントエンド：3333番ポート
  - バックエンド：8888番ポート（競合を回避）
  - 自動ブラウザ起動の無効化（`BROWSER=none`、`--no-open`）

### Cookie-based国際化実装
- [x] **nitoプロジェクトのテーマ・国際化システムを完全コピー**
  - next-themesによるテーマ管理
  - Cookie-based locale管理（URLにlocaleを含めない）
  - Server Actionsを使用した言語切り替え
  - next-intl設定の移行

### Tailwind CSS v4への移行
- [x] **Tailwind CSS v4の完全実装**
  - 新しい@import、@plugin、@theme構文への移行
  - Nito風の完全な色システム（info、success、warning、invalid、link色）
  - chart色とアニメーション遅延ユーティリティの追加
  - PostCSS設定の更新

### プロジェクト構成の整理
- [x] **不要なファイルの削除と整理**
  - localeベースのルーティングファイルを削除
  - 重複する設定ファイルを削除
  - .gitignoreにバックアップファイルパターンを追加
- [x] **commitlint設定の修正**
  - CommonJS構文への変換でエラーを解決
- [x] **最小粒度でのコミット（追加4個）**
  - PostCSS設定の型定義追加
  - .gitignoreの更新
  - next.config.mjsの削除
  - localeルーティングファイルの削除

### データベースシード実装
- [x] **シードファイルの実装**
  - `packages/db/src/seed.ts` - シードデータ投入スクリプト
  - `packages/db/package.json` に `db:seed` コマンド定義済み
  - 重複チェック付きで安全に実行可能
- [x] **シードデータ内容**
  - テストユーザー（test@example.com）
  - タグ3つ（tech, life, development）とその日英翻訳
  - 記事3つ（hello-world, typescript-tips, life-in-2024）とその日英翻訳
  - 記事とタグの関連付け
- [x] **データベース構成**
  - Turso（SQLite互換のクラウドデータベース）を使用
  - 環境変数でデータベース接続を管理

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

### データベース・シード改善
- [ ] **ルートから `pnpm seed` 実行可能にする**
  - ルートpackage.jsonに `seed: "turbo run db:seed"` を追加
  - turbo.jsonに `db:seed` タスク設定を追加
- [ ] **ローカルSQLiteサポート（オプション）**
  - 環境変数DATABASE_URLでローカル/Tursoの切り替え
  - .env.exampleファイルの作成
  - ローカルSQLiteファイルを.gitignoreに追加
- [ ] **シードデータの拡張**
  - より多様なテストデータの追加
  - データクリーンアップオプションの追加
  - 画像URLやメタデータの追加

### Docs
- [ ] 開発環境セットアップガイド
- [ ] API ドキュメント（OpenAPI仕様）
- [ ] テストガイド（Vitest/Storybook/Playwright）
- [ ] コーディング規約とコミット規約

### Chores

- [ ] タイトルは `saneatsu.me` にする
- [ ] ヘッダーの言語選択と、テーマ設定は nitoプロジェクトのヘッダーを参考にする
- [ ] GitHubのリンクは https://github.com/saneatsu/saneatsu.me
- [ ] 公開状態のArticleしか表示されないことを確認。テストもあるか確認
- [ ] 記事のCardには「公開」というステータスは表示させない（公開されているものしか表示されないため）

### Cloudflare Workersへのデプロイ

ドメインは saneatsu.me

- [ ] ToDoを洗い出す

### Tursoへ連携

- [ ] preview環境のDB(preview-saneatsu-me)とproduction環境のDB(saneatsu-me)を両方作成 


### 管理者ページの作成
#### /login: ログインページ
- [ ] GoogleAuthでログインできるページ

#### /admin: 管理者ページ
- [ ] 記事やタグを管理するページ

#### /admin/articles: 記事一覧ページ
- [ ] 記事は「公開済み」「下書き」「アーカイブ済み」の3ステータスがある
- [ ] テーブルで画像サムネイル、タイトル、タグ、最終更新日を表示する
- [ ] 記事は1つ以上のタグを付与する

#### /admin/articles/new: 記事新規作成ページ
- [ ] サムネイル、記事タイトル、タグ（1つ以上）、内容（Markdown）を入力する
- [ ] サムネイルはモバイル用、Web用それぞれのサイズをCloudflare R2にアップロード
- [ ] Cloudflare Imagesの方が適切かもしれない
- [ ] 記事を作成すると日本語と英語の記事どちらも作成することができる

#### /admin/articles/:id: 記事詳細ページ

#### /admin/tags: タグ一覧ページ
- [ ] タグ一覧を表示する
- [ ] タグ名、タグに紐づいている記事の数を表示

#### /admin/tags/new: タグ新規作成ページ


#### /admin/tags/:id: タグ詳細ページ
---


## 📝 次のステップ

1. **スタイリングの完全修復**
   - 現在スタイルが適用されていない問題の解決
   - 開発サーバーの再起動と動作確認

2. **シードデータの投入**
   - `cd packages/db && pnpm db:seed` でテストデータを投入
   - または、ルートから実行できるように設定を追加

3. **リモートリポジトリへのプッシュ（手動実行）**
   - 48個のコミットをプッシュ

4. **shadcn/uiの導入とUIコンポーネントのリファクタリング**
   - nitoプロジェクトの `apps/web/src/shared/ui` を参考
   - Button、Card、Input等の基本コンポーネント導入

5. **ヘッダー・フッターの実装**
   - nitoプロジェクトのヘッダーを参考に言語切り替えとテーマ切り替えを実装
   - GitHubリンクの追加（https://github.com/saneatsu/saneatsu.me）

6. **E2Eテスト（Playwright）の実装**
   - 重要なユーザーフローのテスト

7. **CI/CD環境の構築**
   - GitHub Actionsの設定
   - 自動テスト・デプロイ
