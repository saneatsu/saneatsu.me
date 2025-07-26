#!/bin/bash

# Cloudflare Workers 環境変数設定スクリプト
# Usage: ./scripts/setup-cloudflare-env.sh [environment]
# environment: development, preview, production (デフォルト: development)

set -e

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 環境を取得（デフォルト: development）
ENVIRONMENT=${1:-development}

echo -e "${BLUE}🚀 Cloudflare Workers 環境変数設定スクリプト${NC}"
echo -e "${BLUE}環境: ${YELLOW}${ENVIRONMENT}${NC}"
echo ""

# Wranglerがインストールされているかチェック
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLIがインストールされていません${NC}"
    echo -e "${YELLOW}以下のコマンドでインストールしてください:${NC}"
    echo "npm install -g wrangler"
    exit 1
fi

echo -e "${GREEN}✅ Wrangler CLIが見つかりました${NC}"

# Cloudflareにログインしているかチェック
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Cloudflareにログインしていません${NC}"
    echo -e "${BLUE}ログインを開始します...${NC}"
    wrangler login
fi

echo -e "${GREEN}✅ Cloudflareにログイン済みです${NC}"
echo ""

# バックエンド用環境変数設定
echo -e "${BLUE}📝 バックエンド用環境変数を設定します${NC}"
echo ""

# TURSO_DATABASE_URL
read -p "Turso Database URL を入力してください: " TURSO_DATABASE_URL
if [ -n "$TURSO_DATABASE_URL" ]; then
    echo "$TURSO_DATABASE_URL" | wrangler secret put TURSO_DATABASE_URL --env "$ENVIRONMENT" --name saneatsu-api
    echo -e "${GREEN}✅ TURSO_DATABASE_URL を設定しました${NC}"
else
    echo -e "${YELLOW}⚠️  TURSO_DATABASE_URL をスキップしました${NC}"
fi

# TURSO_AUTH_TOKEN
read -p "Turso Auth Token を入力してください: " TURSO_AUTH_TOKEN
if [ -n "$TURSO_AUTH_TOKEN" ]; then
    echo "$TURSO_AUTH_TOKEN" | wrangler secret put TURSO_AUTH_TOKEN --env "$ENVIRONMENT" --name saneatsu-api
    echo -e "${GREEN}✅ TURSO_AUTH_TOKEN を設定しました${NC}"
else
    echo -e "${YELLOW}⚠️  TURSO_AUTH_TOKEN をスキップしました${NC}"
fi

echo ""

# フロントエンド用環境変数設定
echo -e "${BLUE}🌐 フロントエンド用環境変数を設定します${NC}"
echo ""

# NEXT_PUBLIC_API_URL（環境別デフォルト値）
case "$ENVIRONMENT" in
    "development")
        DEFAULT_API_URL="https://saneatsu-api-dev.workers.dev"
        ;;
    "preview")
        DEFAULT_API_URL="https://saneatsu-api-preview.workers.dev"
        ;;
    "production")
        DEFAULT_API_URL="https://api.saneatsu.me"
        ;;
    *)
        DEFAULT_API_URL="https://saneatsu-api-dev.workers.dev"
        ;;
esac

read -p "API URL を入力してください [${DEFAULT_API_URL}]: " NEXT_PUBLIC_API_URL
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-$DEFAULT_API_URL}

if [ -n "$NEXT_PUBLIC_API_URL" ]; then
    echo "$NEXT_PUBLIC_API_URL" | wrangler secret put NEXT_PUBLIC_API_URL --env "$ENVIRONMENT" --name saneatsu-web
    echo -e "${GREEN}✅ NEXT_PUBLIC_API_URL を設定しました${NC}"
fi

echo ""
echo -e "${GREEN}🎉 環境変数の設定が完了しました！${NC}"
echo ""

# 設定した環境変数を確認
echo -e "${BLUE}📋 設定された環境変数を確認します${NC}"
echo ""

echo -e "${YELLOW}バックエンド (saneatsu-api):${NC}"
cd apps/backend
wrangler secret list --env "$ENVIRONMENT" 2>/dev/null || echo "環境変数が設定されていません"
cd ../..

echo ""
echo -e "${YELLOW}フロントエンド (saneatsu-web):${NC}"
cd apps/web
wrangler secret list --env "$ENVIRONMENT" 2>/dev/null || echo "環境変数が設定されていません"
cd ../..

echo ""
echo -e "${GREEN}🚀 準備完了！以下のコマンドでデプロイできます:${NC}"
echo -e "${BLUE}  pnpm deploy:${ENVIRONMENT}${NC}"
echo ""

# Tursoデータベースの設定ガイド表示
if [ -z "$TURSO_DATABASE_URL" ] || [ -z "$TURSO_AUTH_TOKEN" ]; then
    echo -e "${YELLOW}💡 Tursoデータベースの設定が不完全です${NC}"
    echo -e "${BLUE}以下の手順でTursoデータベースを設定してください:${NC}"
    echo ""
    echo "1. Turso CLIをインストール:"
    echo "   curl -sSfL https://get.tur.so/install.sh | bash"
    echo ""
    echo "2. Tursoにログイン:"
    echo "   turso auth login"
    echo ""
    echo "3. データベースを作成:"
    echo "   turso db create ${ENVIRONMENT}-saneatsu-me"
    echo ""
    echo "4. 認証トークンを生成:"
    echo "   turso db tokens create ${ENVIRONMENT}-saneatsu-me"
    echo ""
    echo "5. データベースURLを取得:"
    echo "   turso db show ${ENVIRONMENT}-saneatsu-me"
    echo ""
    echo "6. このスクリプトを再実行して環境変数を設定"
    echo ""
fi