---
sidebar_position: 1
---

# Introduction

**saneatsu.me** プロジェクトのドキュメントサイトへようこそ！ 🎉

## プロジェクト概要

saneatsu.me は、モダンな技術スタックを使用して構築された個人ブログサイトです。フルスタック TypeScript、Feature-Sliced Design、包括的なテスト戦略を採用しており、スケーラブルで保守性の高いアーキテクチャを実現しています。

## 🎯 開発目的・背景

このプロジェクトは以下の目的で開発されています：

- **個人ブログプラットフォーム**: 技術記事やライフスタイル記事を投稿・管理するためのプラットフォーム
- **技術力の実証**: モダンな技術スタックとベストプラクティスを実践的に活用
- **スケーラブルな設計**: 将来的な機能拡張に対応できる柔軟なアーキテクチャの構築
- **国際化対応**: 日本語・英語での多言語コンテンツ配信

## 💡 プロジェクトの特徴・強み

### 🏗️ **モダンアーキテクチャ**
- **Feature-Sliced Design**: 階層化されたアーキテクチャでコードの可読性と保守性を向上
- **Monorepo**: Turborepo による効率的なマルチパッケージ管理
- **フルスタック TypeScript**: 型安全性による開発効率とバグ削減

### 🧪 **包括的品質保証**
- **Unit & Integration Tests**: Vitest + Testing Library による単体・結合テスト
- **Component Tests**: Storybook による UI コンポーネントの網羅的テスト
- **E2E Tests**: Playwright による実際のユーザーフロー検証
- **静的解析**: Biome による一貫したコード品質維持

### 🌍 **国際化対応**
- **next-intl**: React ベースの国際化ライブラリによる多言語サポート
- **動的言語切り替え**: ユーザーが任意に言語を選択可能
- **URL ベースルーティング**: SEO 最適化された多言語 URL 構造

### ⚡ **パフォーマンス最適化**
- **Next.js 15**: 最新の React Server Components とストリーミング
- **Hono**: 高速な API レスポンスを実現する軽量フレームワーク
- **Drizzle ORM**: 型安全で高パフォーマンスなデータベースアクセス

## 🛠️ システム構成

### **Frontend (Next.js App)**
```
apps/web/
├── src/
│   ├── app/          # App Router（多言語対応）
│   ├── entities/     # ビジネスエンティティ
│   ├── features/     # ユーザー機能
│   ├── shared/       # 共通ライブラリ
│   ├── views/        # ページレベルコンポーネント
│   └── widgets/      # 独立UIブロック
```

### **Backend (Hono API Server)**
```
apps/backend/
├── src/
│   ├── routes/       # API エンドポイント
│   │   ├── articles/ # 記事管理 API
│   │   └── tags/     # タグ管理 API
│   └── utils/        # ユーティリティ
```

### **Shared Packages**
```
packages/
├── db/               # データベース・スキーマ
├── i18n/             # 国際化リソース
└── schemas/          # 共通型定義・バリデーション
```

## 📋 実装済み機能

### **記事管理システム**
- **記事一覧表示**: ページネーション・フィルタリング対応
- **記事詳細表示**: Markdown レンダリング・シンタックスハイライト
- **多言語対応**: 記事の日英切り替え表示
- **タグシステム**: 記事のカテゴリ分類・フィルタリング

### **ユーザーインターフェース**
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **ダークモード**: システム設定連動・手動切り替え
- **言語切り替え**: ヘッダーからの動的言語変更
- **検索・フィルタ**: 記事の検索・タグフィルタ機能

### **API エンドポイント**
- `GET /api/articles` - 記事一覧取得（ページネーション・言語対応）
- `GET /api/articles/[slug]` - 記事詳細取得（言語対応）
- `GET /api/tags` - タグ一覧取得
- **OpenAPI 仕様**: 自動生成された API ドキュメント

## 🔧 技術選定の理由

### **Next.js 15 + React 19**
- **Server Components**: サーバーサイドレンダリングによる初期ロード高速化
- **App Router**: ファイルベースルーティングによる直感的な構造
- **Image Optimization**: 自動的な画像最適化・WebP変換

### **Hono + OpenAPI**
- **高速性**: Express.js より約3倍高速なレスポンス
- **型安全性**: TypeScript ファーストな設計
- **OpenAPI 統合**: 自動的な API ドキュメント生成

### **Drizzle ORM**
- **型安全性**: SQL クエリの TypeScript 型推論
- **パフォーマンス**: 軽量で高速なクエリ実行
- **マイグレーション**: 型安全なスキーマ管理

### **Feature-Sliced Design**
- **スケーラビリティ**: 機能追加時の影響範囲を最小化
- **保守性**: 責任の明確な分離による理解しやすいコード
- **チーム開発**: 複数人での並行開発に適した構造

## 🚀 Getting Started

このドキュメントサイトは saneatsu.me プロジェクトの包括的な仕様書として、開発者の皆様に詳細な技術情報を提供します。

### **開発者向け**
プロジェクトへの参加や理解を深めたい場合は、以下の順序でドキュメントをご覧ください：

1. **📚 Tech Stack** - 使用技術の詳細解説（準備中）
2. **🏗️ Architecture** - システム設計・FSD アーキテクチャ（準備中）
3. **🛠️ Development Setup** - 開発環境構築手順（準備中）
4. **🧪 Testing Guide** - テスト戦略・実装方法（準備中）

### **API 利用者向け**
外部サービスとの連携や API を利用したい場合：

1. **🌐 API Overview** - API 仕様概要（準備中）
2. **📖 Articles API** - 記事データの取得・操作（準備中）
3. **🏷️ Tags API** - タグシステムの利用（準備中）

## 📈 今後の開発予定

### **Phase 1: 管理者機能（進行中）**
- **認証システム**: Google Auth 連携
- **記事管理**: Web ベースの記事作成・編集・公開機能
- **タグ管理**: タグの作成・編集・削除機能
- **画像管理**: Cloudflare Images 連携

### **Phase 2: ユーザー体験向上**
- **コメントシステム**: 記事へのコメント機能
- **検索機能**: 全文検索・高度フィルタリング
- **RSS フィード**: 記事更新の自動配信
- **PWA 対応**: オフライン読み込み・プッシュ通知

### **Phase 3: 拡張機能**
- **Newsletter**: メール配信システム
- **Analytics**: 詳細なアクセス解析
- **SNS 連携**: 自動投稿・シェア機能

## 🤝 Contributing

このプロジェクトへの貢献を歓迎します！

- **Bug Reports**: [GitHub Issues](https://github.com/saneatsu/saneatsu.me/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/saneatsu/saneatsu.me/discussions)
- **Pull Requests**: Contributing Guide（準備中）

---

**質問や問題がある場合は、[GitHub Issues](https://github.com/saneatsu/saneatsu.me/issues) でお気軽にお知らせください！**