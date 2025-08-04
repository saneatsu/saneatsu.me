# プロジェクト構造

## ルートディレクトリ
```
saneatsu.me/
├── apps/                      # アプリケーション
│   ├── web/                   # メインのNext.jsフロントエンド
│   ├── backend/               # バックエンドAPI
│   └── docs/                  # ドキュメンテーション
├── packages/                  # 共有パッケージ
│   ├── db/                    # Drizzle ORMとデータベーススキーマ
│   ├── i18n/                  # 国際化設定
│   └── schemas/               # 共通Zodスキーマ
├── scripts/                   # ユーティリティスクリプト
├── .github/                   # GitHub Actions設定
├── .serena/                   # Serena設定
├── .claude/                   # Claude設定
├── .kiro/                     # Kiro設定
├── CLAUDE.md                  # プロジェクト固有のClaude指示
├── package.json               # ルートパッケージ設定
├── pnpm-workspace.yaml        # pnpmワークスペース設定
├── turbo.json                 # Turborepo設定
├── biome.json                 # Biome設定
├── tsconfig.json              # TypeScript設定
├── commitlint.config.cjs      # Commitlint設定
├── lefthook.yml               # Git hooks設定
└── vitest.config.ts           # Vitest設定
```

## apps/web構造（Feature-Sliced Design）
```
apps/web/
├── src/
│   ├── app/                   # Next.js App Router
│   ├── shared/                # 共有レイヤー
│   │   ├── ui/               # 基本UIコンポーネント
│   │   ├── lib/              # ユーティリティ関数
│   │   └── config/           # 設定
│   ├── entities/              # ビジネスエンティティ
│   │   └── [entity]/
│   │       ├── model/        # データモデル
│   │       ├── api/          # API関数
│   │       └── ui/           # UIコンポーネント
│   ├── features/              # 機能レイヤー
│   │   └── [feature]/
│   │       ├── model/
│   │       ├── api/
│   │       └── ui/
│   ├── widgets/               # ウィジェットレイヤー
│   │   └── [widget]/
│   │       └── ui/
│   └── views/                 # ビューレイヤー（ページ）
│       └── [view]/
│           └── ui/
├── public/                    # 静的ファイル
├── tests/                     # E2Eテスト
├── .storybook/               # Storybook設定
├── messages/                  # i18n翻訳ファイル
├── next.config.js            # Next.js設定
├── tailwind.config.ts        # Tailwind設定
├── playwright.config.ts      # Playwright設定
└── wrangler.toml             # Cloudflare設定
```

## 主要な設定ファイル

### モノレポ管理
- `turbo.json`: タスクの依存関係とキャッシュ設定
- `pnpm-workspace.yaml`: ワークスペースのパッケージ定義

### 開発ツール
- `biome.json`: コードフォーマットとlint設定
- `tsconfig.json`: TypeScript設定（各パッケージにも存在）
- `lefthook.yml`: Git hooks（pre-commit、commit-msg）

### テスト
- `vitest.config.ts`: ユニットテスト設定
- `playwright.config.ts`: E2Eテスト設定
- `.storybook/`: Storybookの設定

### デプロイ
- `wrangler.toml`: Cloudflare Workers設定
- `.github/workflows/`: CI/CDワークフロー

## 重要なディレクトリ

### コード
- `src/shared/ui/`: shadcn/uiコンポーネント
- `src/entities/`: ビジネスロジックとデータモデル
- `src/features/`: アプリケーション機能
- `messages/`: 多言語対応の翻訳ファイル

### テスト
- `**/*.test.ts(x)`: ユニットテスト
- `**/*.stories.tsx`: Storybookストーリー
- `tests/`: E2Eテスト

### ビルド出力
- `.next/`: Next.jsビルド出力
- `.wrangler/`: Cloudflareビルド出力
- `dist/`: 一般的なビルド出力
- `.turbo/`: Turboキャッシュ