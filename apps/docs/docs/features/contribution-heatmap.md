---
sidebar_position: 2
---

# 更新頻度ヒートマップ仕様

GitHub の「草」スタイルで、日ごとの更新頻度と日本語文字数を可視化する機能の仕様をまとめます。ダッシュボードと `/about` の双方に同じ集計結果を表示します。表示期間は「今日を含む直近 1 年」であり、うるう年を跨ぐ場合は 366 日ぶんのセルを自動的にカバーします。

## ゴール

- 365 日（約 53 週）の活動量を一目で把握できるようにする
- 「どの日にどれだけ書いたか」を定量化し、継続的執筆のモチベーションにする
- 公開プロフィール(`/about`)で透明性の高いアウトプット実績を示す

## 用語と指標

| 用語 | 定義 |
| --- | --- |
| **更新イベント** | 記事作成、記事本文(ja)の保存、記事ステータス変更(published/draft/archived)のいずれか。1 回のイベント = 1 更新。|
| **更新頻度** | 1 日に発生した更新イベントの合計値。複数記事・複数回の更新はその都度加算。|
| **日本語文字数** | 更新イベントで増加した日本語文字の総量。Markdown → プレーンテキスト化後、`[一-龯ぁ-んァ-ヶーｦ-ﾟー]` にマッチする文字数の差分（負値は 0 として切り上げ）。記事ステータスが draft / published / archived のいずれであっても、新規作成・更新時に保存された ja 本文の差分はすべて「執筆量」として加算する。|

## 集計ロジック

### 永続化テーブル

`daily_article_contributions`

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `date` | TEXT(YYYY-MM-DD) | PK。タイムゾーンは Asia/Tokyo（JST）で日付切替。UTC ではなく日本時間基準で 1 日を区切る。|
| `updates` | INTEGER | 当日の更新イベント数。|
| `ja_char_count` | INTEGER | 当日の日本語文字増加合計。|
| `updated_at` | TEXT | 最終更新日時。|

### イベント収集

トリガー: `create-article`, `update-article`, `update-status` ハンドラ。

1. 既存の ja 翻訳（`article_translations`）を取得し、Markdown を除去 → HTML エンティティ解除 → 改行/空白正規化。
2. 日本語文字のみを `match(/[一-龯ぁ-んァ-ヶーｦ-ﾟー]/g)` で抽出し長さを算出。
3. 差分 = `max(0, newJaLength - oldJaLength)`（旧データが無い場合は新規長さ）。公開・下書きに関係なく、保存イベントが起きたら必ず差分を計上する。
4. `date = zonedTimeToUtc(now, 'Asia/Tokyo').toISOString().split('T')[0]`。
5. `updates += 1`、`ja_char_count += 差分` を UPSERT。

### バックフィル & 再計算

- `scripts/backfill-contributions.ts` で `articles` / `article_translations` を走査し、`updatedAt` を基準に再構築。
- CRON Worker (daily 03:00 JST) で「当日以前 2 日間」を再集計し、欠損やタイムゾーン誤差をリカバリ。
- 再計算は `INSERT ... ON CONFLICT DO UPDATE SET updates = excluded.updates, ja_char_count = excluded.ja_char_count, updated_at = CURRENT_TIMESTAMP`。

## API 仕様

### 管理ダッシュボード

- 既存 `/api/dashboard/overview` 応答に `contributions` を追加。
- 返却形:

```ts
export type ContributionDay = {
  date: string;      // YYYY-MM-DD, JST での1日
  updates: number;   // >= 0
  jaChars: number;   // >= 0
};

export type ContributionSummary = {
  startDate: string;   // 365 日前
  endDate: string;     // 本日
  totalUpdates: number;
  totalJaChars: number;
  maxUpdates: number;  // カラースケール算出用
  maxJaChars: number;
  days: ContributionDay[]; // 365 or 366 件
  lastUpdated: string;  // ISO8601
};
```

### 公開エンドポイント

- `GET /api/public/contributions?range=365&locale=ja`
  - `range`: 30/90/180/365（日数）。デフォルト 365。
  - `locale`: ja/en（i18n 用、データ内容に影響なし）。
- キャッシュ: Cloudflare Cache で `max-age=300`, `stale-while-revalidate=3600`。
- レスポンスは `ContributionSummary` と同一。

## UI/UX 仕様

### ダッシュボード

- セクション名: 「執筆アクティビティ」。`StatsCards` 下に配置。
- 表示要素
  - 53 週 × 7 行のヒートマップ（365 or 366 日のデータをフィットさせる）。
  - トグル（`更新数` / `日本語文字数`）。
  - 総更新数・総文字数・連続執筆日数のサマリー。
  - 最終更新時刻と「再集計」ボタン（管理者のみ）。
- カラースケール
  - 0（実績なし）+4 つの閾値で計 5 段階の相対スケール。例: `updates` は 0=muted, 1-2=brand/20, 3-4=brand/40, 5-7=brand/60, 8+=brand/80。
  - `jaChars` も 5 段階（0=muted, 1-300=teal/20, 301-800=teal/40, 801-1500=teal/60, 1501+=teal/80）。
- ツールチップ: `{date} · {updates} 更新 · {jaChars} 文字`。
- A11y: 各セルに `role="button"` + `aria-label="{date} {updates} 更新 {jaChars} 文字"`、キーボード移動は矢印キー対応。

### /about ページ

- セクション名: `Writing cadence`（英）/ `執筆の歩み`（日）。
- 公開 API を利用し、同じヒートマップを読み取り専用で表示。
- 追加文言：直近 365 日の累計値と「もっと読む」リンク（ブログ一覧）。
- ローディング/エラー
  - ローディング: シマー 3 行。
  - データ無し: 「まだ記録がありません」。

## i18n

- 文言キーを `packages/i18n/src/messages/{locale}/contributions.json` にまとめる。
- 主要キー: `title`, `subtitle`, `toggle.updates`, `toggle.jaChars`, `tooltip.updates`, `tooltip.jaChars`, `summary.totalUpdates`, `summary.totalChars`, `summary.streak`。

## テスト観点（Phase1 TODO）

- 集計ユーティリティ: Markdown 除去・日本語文字抽出・差分計算（負値クリップ）の単体テスト。
- タイムゾーン: JST ローカルタイムで日付を跨いだ際に正しく日付キーが変わるかのテスト（モッククロック含む）。
- うるう年: 2/29 を含むレンジで 366 件のデータが返ること、平年では 365 件であること。
- ドラフト更新: `status=draft` の記事を保存しても更新イベント＋文字数差分が積算されることの API/DB テスト。
- カラースケール: 0/閾値境界を跨ぐセルでクラス名（orカラートークン）が切り替わるかのコンポーネントテスト。

## 運用メモ

- デプロイ順序: DB マイグレーション → バックエンド → バックフィル → フロント。
- バックフィル完了後に CRON を有効化し、Wrangler で失敗通知を Slack へルーティング。
- ダッシュボードの「再集計」ボタンは `/api/dashboard/rebuild-contributions` を叩き、WRKV キュー経由で Worker を起動する想定（管理者 JWT が必要）。
