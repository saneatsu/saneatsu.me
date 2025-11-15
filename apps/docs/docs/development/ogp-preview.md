---
title: OGPプレビュー
---

OGPのスクリーンショットやX(Twitter)のカード表示を検証するときは、外部からアクセスできるURLが必要です。開発中は `http://localhost:3333` でサイトを起動した上で、ngrokを使って一時的に公開します。

## 前提

- フロントエンドをポート3333で起動している (`pnpm --filter @saneatsu/frontend dev -p 3333` 等)
- Homebrew がインストール済み

> **NOTE:** Next.jsのデフォルトポート(3000)を使用している場合は、あとで `ngrok http 3000` に読み替えてください。

## セットアップ手順

1. ngrokをインストールします。

   ```bash
   brew install ngrok
   ```

2. https://ngrok.com/ にログインし、ダッシュボードの [Get started / Setup](https://dashboard.ngrok.com/get-started/setup) で Authtoken をコピーします。

3. 取得したトークンをローカルに登録します。

   ```bash
   ngrok config add-authtoken HOGEhogeHogehoge
   ```

## トンネルの開始

1. フロントエンドがポート3333で動いていることを確認します。
2. ngrokでHTTPトンネルを開きます。

   ```bash
   ngrok http 3333
   ```

3. コンソールに `Forwarding` として表示される `https://xxxx.ngrok-free.app` をコピーし、X Card Validator や Slack/Twitter などのOGPプレビューに貼り付けます。
4. 確認が終わったら `Ctrl + C` でトンネルを終了します。

## よくある質問

- **別ポートでNext.jsを動かしている**  
  `ngrok http <port>` の `<port>` を実際のポート番号に置き換えればOKです。
- **Authtokenを忘れた/再発行した**  
  `ngrok config add-authtoken <new-token>` を再度実行します。
- **ngrokを再起動したらURLが変わった**  
  無料プランでは毎回URLが変わります。再度トンネルを貼り、検証ツールに新しいURLを貼り直してください。
