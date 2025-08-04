# 技術スタック

## フロントエンド
- **フレームワーク**: Next.js 15.x（App Router）
- **言語**: TypeScript 5.8.x
- **UIライブラリ**: 
  - shadcn/ui（コンポーネントライブラリ）
  - Radix UI（プリミティブコンポーネント）
  - Tailwind CSS 4.x（スタイリング）
  - tailwindcss-animate（アニメーション）
- **フォーム管理**: React Hook Form + Zod（バリデーション）
- **国際化**: next-intl
- **状態管理**: 
  - TanStack Query（サーバー状態）
  - nuqs（URLクエリ状態）
- **テーマ**: next-themes（ダークモード対応）
- **Markdown**: @uiw/react-md-editor、react-markdown

## バックエンド
- **フレームワーク**: Next.js + Hono（API）
- **ORM**: Drizzle ORM
- **認証**: NextAuth.js (Auth.js) 5.0 beta

## データベース
- **本番**: Turso（LibSQL - SQLite互換）
- **開発**: LibSQL Client

## インフラストラクチャ
- **ホスティング**: Cloudflare Workers
- **ビルド**: OpenNext.js Cloudflare
- **CDN**: Cloudflare

## 開発ツール
- **モノレポ管理**: Turborepo
- **パッケージマネージャー**: pnpm
- **Linter/Formatter**: Biome
- **Git Hooks**: Lefthook
- **コミット規約**: Commitlint（Conventional Commits）

## テストツール
- **ユニットテスト**: Vitest + Testing Library
- **コンポーネントテスト**: Storybook 9.x
- **E2Eテスト**: Playwright
- **モック**: MSW（Mock Service Worker）

## CI/CD
- **GitHub Actions**: ワークフロー（.github/workflows/）
- **デプロイ**: Wrangler CLI（Cloudflare）