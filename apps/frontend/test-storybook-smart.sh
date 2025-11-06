#!/bin/bash

# Storybookテストをスマートに実行するスクリプト
# ポート6016が使用中の場合は既存のサーバーを使用し、
# そうでない場合はCIモードでサーバーを起動してテストを実行

PORT=6016

# ポートが使用中かチェック
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "ℹ️  Storybook server is already running on port $PORT. Using existing server..."
    pnpm test-storybook
else
    echo "🚀 Starting Storybook server in CI mode on port $PORT..."
    pnpm test-storybook:ci
fi
