# プロジェクト進捗状況

## 📊 現在の状態
- **総コミット数**: 61個（mainブランチより先）
- **主な実装**: バックエンドAPI、フロントエンド基盤、テスト環境、国際化、Tailwind CSS v4、ルーティングベース多言語対応
- **現在の課題**: 型エラー（article-detailビューのReact型不一致）

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

### ルーティングベース多言語対応
- [x] **URL構造の変更**
  - Cookie-basedからURL-basedへの移行（`/ja/articles`、`/en/articles`）
  - SEO最適化のためのURL構造採用
- [x] **middleware.tsの実装**
  - Accept-Languageヘッダーからの自動言語検出
  - ロケールが含まれていないURLへの自動リダイレクト
  - 静的ファイルとAPIルートの除外設定
- [x] **[locale]ディレクトリ構造**
  - `app/[locale]/layout.tsx` - ロケール別レイアウト
  - `app/[locale]/page.tsx` - ホームページ
  - `app/[locale]/articles/` - 記事関連ページ
  - generateStaticParamsでの静的生成対応
- [x] **hreflangタグの実装**
  - generateMetadataでのSEO対応
  - 言語別メタデータ（タイトル、説明文）
  - alternates.languagesでの言語バージョン指定
- [x] **LanguageSwitcherの統合**
  - features/langのLanguageSwitcherをヘッダーに統合
  - URL更新による言語切り替え実装
- [x] **既存コンポーネントの多言語対応**
  - HomeViewコンポーネントのi18n対応
  - FooterコンポーネントのURL更新とi18n対応
  - HeaderコンポーネントのロケールURL対応
- [x] **ArticleDetailViewの復元**
  - サーバーコンポーネントラッパーの実装
  - データフェッチとi18n対応
- [x] **最小粒度での13個のコミット作成**
  1. locale-based layout作成
  2. home pageの移動
  3. articles pagesの追加
  4. root pageのリダイレクト
  5. middleware実装
  6. i18n設定更新
  7. 日本語翻訳追加
  8. 英語翻訳追加
  9. HomeViewのi18n対応
  10. Footerのi18n対応
  11. HeaderのLanguageSwitcher統合
  12. root layoutの簡略化
  13. ArticleDetailViewの復元

### Cloudflare Workersへのデプロイ
- [x] **ドメイン設定**
  - saneatsu.me ドメインでのデプロイ完了
  - api.saneatsu.me でバックエンドAPI公開
- [x] **OpenNext設定**
  - `@opennextjs/cloudflare`でNext.jsをCloudflare Workers対応
  - 静的アセット配信の設定（`public/_headers`）
  - wrangler.tomlでのassets設定
- [x] **環境別デプロイ**
  - preview環境：`saneatsu-me-web-preview.pages.dev`
  - production環境：`saneatsu.me`

### Tursoデータベース連携
- [x] **環境別データベース作成**
  - preview環境：`preview-saneatsu-me`データベース作成
  - production環境：`saneatsu-me`データベース作成
- [x] **マイグレーション実行**
  - 両環境でのスキーママイグレーション完了
  - シードデータの投入完了
- [x] **環境変数設定**
  - Cloudflare環境でのTURSO_DATABASE_URLとTURSO_AUTH_TOKEN設定

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

### usersテーブルの作成

- [ ] Google Authログインを許可するユーザーを管理する
  - 基本的に自分しかログインしないのにテーブルを作成するべき？
  - テーブルを作成しない場合、どうやって許可するメールアドレスを管理するべき？

### Docs
- [ ] 開発環境セットアップガイド
- [ ] API ドキュメント（OpenAPI仕様）
- [ ] テストガイド（Vitest/Storybook/Playwright）
- [ ] コーディング規約とコミット規約

### /login: ログインページ
- [x] GoogleAuthでログインできるページ
  - NextAuth.js (beta) でGoogle OAuth認証実装
  - 管理者メールアドレスのみアクセス許可

### /admin: 管理者ページ
- [x] 認証保護された管理画面レイアウト
- [x] サイドバーナビゲーション
- [x] ユーザー情報表示とログアウト機能
- [x] middlewareの実装
  - ログインしていない場合、している場合で分けて網羅的なテストを追加
  - 同時にVitestも追加すること
  - 認証チェック、言語ルーティング、除外パスの処理を網羅的にテスト
  - 全17テストが正常に動作
- [x] サイドバーの作成
  - shadcnが用意している npx shadcn@latest add sidebar-07 を参考にしてください。基本的にはこのshadcnの実装に従うこと
  - ダッシュボードは左側
  - ダッシュボードの右側に開閉を可能にするアイコンを表示
  - 開閉用のアイコンの右側にはパンくずリストを表示
  - ログイン中のユーザー情報はダッシュボードの下側に表示  
  - サイドバーの内容は「ダッシュボード」「記事」「タグ」の3つ
  - 選択中のサイドバーアイテムは選択中であることがわかるようなスタイルになること  
- [x] サイドバーの下にあるプロフィールの修正
  - クリックしたら右側からテーマを選択できるようにすること（3つ）
  - その下にログアウトボタンをつけること（赤色、Lucideのアイコンあり）
- [ ] ダッシュボードの統計情報実装
  - 記事のランキングなどを表示したいが優先度が低いのでスキップ

### /admin: ダッシュボードページ

- [ ] 記事数、下書き数を表示

### /admin/articles: 記事一覧ページ

記事一覧をデータテーブル型式で表示する

- [x] 汎用的なテーブルコンポーネントの作成
  - [x] https://ui.shadcn.com/docs/components/data-table を使用すること
  - [x] ページネーションができる
  - [x] 1ページに表示するアイテムの数を50, 100, 150 から選択できるようにして（デフォルトは50）
  - [x] ページネーションや1ページあたりの表示件数は更新したらURLに反映される
    - nuqs を使用して実装済み
  - [x] すべてのアイテムの数も表示されること
- [x] テーブルカラムは左から画像サムネイル、タイトル、タグ、ステータス、最終更新日
- [x] 「公開済み」「下書き」「アーカイブ済み」の3ステータスがある
- [x] 言語カラムは必要ないし、言語のフィルタリングは必要ありません

### /admin/articles/new: 記事新規作成ページ

- [x] ページのルーティング設定
  - [x] /admin/articles/newのページファイル作成
  - [x] レイアウトとナビゲーションの統合
- [x] 記事作成フォームの実装
  - [x] タイトル入力フィールド（日本語のみ）
  - [x] スラッグ入力（任意入力・重複チェック付き）
  - [x] ステータス選択（下書き/公開済み）
  - [x] 公開日時の設定
- [x] Markdownエディタの導入
  - [x] @uiw/react-md-editorの導入
  - [x] 縦半分分割プレビュー機能の実装
  - [x] 日本語のみ入力（画像コピペ機能は不要）
- [x] タグ選択機能
  - [x] 複数選択可能なUIコンポーネント（jaderプロジェクト参考）
  - [x] 既存タグの取得API
  - [x] 最低1つのタグ必須バリデーション
- [ ] 自動翻訳機能
  - [ ] 日本語入力を他言語に自動翻訳
  - [ ] Google Cloud Translation API または DeepL APIの利用
  - [ ] 保存時に自動実行
- [ ] フォームバリデーション
  - [x] Zodスキーマの定義（基本的なバリデーションは実装済み）
  - [x] React Hook Formの統合
  - [ ] エラーメッセージの日本語化（完全対応）
- [x] バックエンドAPI
  - [x] POST /api/articles エンドポイントの実装
  - [x] GET /api/articles/check-slug スラッグ重複チェックAPI
  - [ ] 日本語・英語の同時保存処理（自動翻訳待ち）
  - [ ] トランザクション処理の実装（自動翻訳待ち）

### /admin/articles/:id: 記事詳細ページ

- [x] packages/schemas のタグ型定義を日英必須に更新
  - [x] createTagSchemaとupdateTagSchemaに日英両方の必須バリデーション追加
  - [x] i18nメッセージ（bothLanguagesRequired、bothJaEnRequired）の追加
- [x] バックエンドAPIにタグCRUD機能を追加
  - [x] GET /api/tags/:id - タグ詳細取得エンドポイント
  - [x] POST /api/tags - タグ作成エンドポイント（スラッグ重複チェック付き）
  - [x] PUT /api/tags/:id - タグ更新エンドポイント
  - [x] DELETE /api/tags/:id - タグ削除エンドポイント（使用中チェック付き）
  - [x] OpenAPIスキーマ定義の追加
- [x] タグCRUD機能のVitestテストを作成
  - [x] GET /tags/:id のテスト（正常系・404エラー）
  - [x] POST /tags のテスト（正常系・重複エラー）
  - [x] PUT /tags/:id のテスト（正常系・404エラー・重複エラー）
  - [x] DELETE /tags/:id のテスト（正常系・使用中エラー・404エラー）
- [x] /admin/tags: タグ一覧ページ
  - [x] shadcn/uiのデータテーブルを使用したタグ一覧表示
  - [x] タグ名（日本語・英語）の表示
  - [x] スラッグの表示
  - [x] 紐付いている記事数の表示
  - [x] 編集・削除アクションボタン
  - [x] ページネーション機能（nuqs使用）
  - [x] 新規作成ボタン（/admin/tags/newへのリンク）
- [x] /admin/tags/new: タグ新規作成ページ
  - [x] タグフォームコンポーネントの実装
  - [x] スラッグ入力フィールド（重複チェック付き）
  - [x] 日本語名・英語名入力フィールド（必須）
  - [x] React Hook Form + Zodでのバリデーション
  - [x] 作成APIの呼び出し処理
  - [x] 成功時のタグ一覧へのリダイレクト
  - [x] エラーハンドリング（重複エラー等）
- [x] /admin/tags/:id/edit: タグ編集ページ
  - [x] 既存タグ情報の取得・表示
  - [x] タグフォームコンポーネントの再利用
  - [x] 更新APIの呼び出し処理
  - [x] 成功時のタグ一覧へのリダイレクト
  - [x] エラーハンドリング
- [x] タグ削除機能
  - [x] AlertDialog UIコンポーネントの追加（shadcn/ui）
  - [x] 削除確認ダイアログの実装
  - [x] タグ名の表示・使用中の記事数の表示（警告）
  - [x] 確認・キャンセルボタン
  - [x] 削除APIの呼び出し処理
  - [x] 使用中エラーの表示（削除不可）
- [x] フロントエンド実装
  - [x] React Query（TanStack Query）でのAPI統合
  - [x] Hono Clientを使用した型安全なAPI呼び出し
  - [x] Entity-Sliced Design（entities/tag/）での実装
  - [x] 最小粒度でのコミット（7個のコミット）

### 記事詳細ページの実装（/articles/:slug）

- [ ] H1のタイトルを一番上に書く
- [ ] その下にタグを表示する
- [ ] タグをクリックしたら /tags/:id に遷移すること
- [ ] Markdownで記事を表示する
- [ ] ステータスが公開済みの場合は表示されること
- [ ] 下書き、アーカイブ済みの場合は404にすること
- [ ] apps/backend, apps/web のテストを書くこと
- [ ] 右サイドに見出しごとのアウトラインが表示されること。クリックしたらアンカーリンクで飛ぶ

### 記事作成機能の完成

- [ ] 自動翻訳機能（Phase 1の残タスク）
  - [ ] 日本語入力を他言語に自動翻訳
  - [ ] Google Cloud Translation API または DeepL APIの利用
  - [ ] 保存時に自動実行
- [ ] エラーメッセージの完全日本語化
- [ ] 日本語・英語の同時保存処理（自動翻訳待ち）
- [ ] トランザクション処理の実装（自動翻訳待ち）

### 管理画面の改善

- [ ] ダッシュボードの統計情報実装
  - [ ] 記事数、下書き数を表示
  - [ ] 記事のランキングなどを表示

### 画像アップロード機能（今回は実装しない）
- [ ] サムネイル画像のアップロード（適当な画像を用意）
- [ ] Cloudflare Images/R2の選定と実装
- [ ] 画像のリサイズ処理（モバイル/Web用）

### テスト実装
- [ ] **E2Eテスト（Playwright）**
  - [ ] 重要なユーザーフローのテスト
  - [ ] 認証フローのテスト
  - [ ] 管理画面アクセステスト
  - [ ] アーカイブ化した記事のURLにアクセスしたら404になること

### UI/UX改善
- [ ] 記事の閲覧数カウント機能
  - [ ] article_translationsテーブルにカラムを追加するか検討
  - [ ] URLごと、つまり言語ごとにカウント

### Chores

- [ ] タイトルは `saneatsu.me` にする
- [x] ヘッダーの言語選択（LanguageSwitcher統合済み）
- [ ] テーマ設定は nitoプロジェクトのヘッダーを参考にする
- [ ] GitHubのリンクは https://github.com/saneatsu/saneatsu.me
- [ ] 公開状態のArticleしか表示されないことを確認。テストもあるか確認
- [ ] 記事のCardには「公開」というステータスは表示させない（公開されているものしか表示されないため） 
- [ ] Gemini連携。筆者・読者がそれぞれわかったつもりになることを避けるため、ドキュメントの内容をGeminiに読み込ませて対話（アウトプット）することで理解を深めることを目的とする。読んで「良さそうだった」だけで満足するのに留まらずに、自身の具体的経験をインプットし内省することで、抽象的な記事を自身の経験とリンクさせ血肉にすることができると考えている。

### その他
- [ ] デモページの作成（demo.saneatsu.me）
- [ ] Obsidian/Scrapboxの概念導入
- [ ] CI/CD設定（GitHub Actions）

## 📝 完了済みの主要機能

✅ **管理者認証システム** - Google OAuth、NextAuth.js  
✅ **タグ管理機能（Phase 2）** - CRUD操作、React Query、shadcn/ui  
✅ **記事管理の基盤** - データベース、API、基本UI  
✅ **国際化対応** - next-intl、URL-based locale  
✅ **デプロイ環境** - Cloudflare Workers、Turso DB
