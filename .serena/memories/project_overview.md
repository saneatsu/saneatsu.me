# saneatsu.me プロジェクト概要

## プロジェクトの目的
saneatsuのポートフォリオサイト。個人のプロジェクトやスキルを紹介するためのWebアプリケーション。

## プロジェクト構成
Turborepoを使用したモノレポ構造で、以下のパッケージで構成されている：

### アプリケーション（apps/）
- **web**: メインのNext.jsフロントエンドアプリケーション（ポート: 3333）
- **backend**: バックエンドAPI（Next.js）  
- **docs**: ドキュメンテーションサイト

### 共有パッケージ（packages/）
- **db**: データベーススキーマとDrizzle ORM設定
- **i18n**: 国際化（多言語対応）設定
- **schemas**: 共通のZodスキーマ定義

## デプロイ環境
- **インフラ**: Cloudflare Workers（OpenNext.js）
- **データベース**: Turso（LibSQL）
- **環境**: development、preview、production

## 開発環境
- **OS**: Darwin（macOS）
- **パッケージマネージャー**: pnpm (9.0.0以上)
- **Node.js**: 18.0.0以上