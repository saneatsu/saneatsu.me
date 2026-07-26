---
sidebar_position: 4
---

# 多言語翻訳とデプロイ (i18n)

多言語対応（記事・ギャラリー・タグ・UI文言）を staging / production へ反映する手順と、
新しい言語を追加するときのチェックリストをまとめます。

## 翻訳の2系統

翻訳対象は大きく2つに分かれます。

| 系統 | 対象 | 保存場所 | 翻訳手段 |
|---|---|---|---|
| **静的UI文言** | ボタン・ラベル・バリデーション等 | `packages/i18n/src/locales/<locale>.json` | 手動で翻訳ファイルを用意 |
| **動的コンテンツ** | 記事・ギャラリー画像・タグ | DB の `*_translations` テーブル | 日本語(ja)を原文に Gemini で自動翻訳 |

翻訳先の言語は `apps/backend/src/services/gemini-translation/gemini-translation.ts` の
`TARGET_LANGUAGES` を単一のソース・オブ・トゥルースとしています。

## 新規コンテンツと既存コンテンツの違い（重要）

動的コンテンツの翻訳は、**新規・既存で反映方法が異なります**。

- **新規/更新コンテンツ**: 記事の作成・更新（published のみ）、ギャラリー画像のアップロード時に、
  `TARGET_LANGUAGES` の全言語へ自動翻訳されて DB に保存されます。デプロイ後は自動で反映されます。
- **既存コンテンツ**: 後から言語を追加した場合、既存レコードにはその言語の翻訳行がありません。
  **自動では入らない**ため、後述のバックフィルスクリプトを手動実行する必要があります。
  これを行わないと、例えば `/es/blog/[slug]` が 404 になります
  （`get-article` は `language = lang` を厳密一致で引くため）。

## デプロイフロー（コードは自動反映）

コードの反映は GitHub Actions で自動化されています
（`.github/workflows/deploy-backend.yml` / `deploy-web.yml`）。

| 操作 | 反映先 | 仕組み |
|---|---|---|
| PR を開く（draft 以外） | **staging = preview 環境** | `pull_request` トリガーで自動デプロイ |
| main へマージ（= main への push） | **production** | `push: branches: [main]` で自動デプロイ |
| 手動実行 | 任意 | 各ワークフローの `workflow_dispatch` |

対象パスは `apps/backend/**`・`apps/frontend/**`・`packages/**` です。

### DB スキーマ変更（enum への言語追加）はマイグレーション不要

`*_translations` テーブルの `language` enum に言語を足すと `migrate-database.yml` が
トリガーされますが、実処理の `drizzle-kit db:push` は SQLite の text enum に CHECK 制約を
張らないため**実質 no-op**です。新しい SQL マイグレーションファイルも不要で、DB 構造の変更は起きません。

## バックフィルの実行（唯一の手動ステップ）

既存コンテンツの翻訳を埋めるスクリプトが `apps/backend/src/scripts/backfill-translations.ts` です。
コマンドは `db:backfill` で登録されています。

:::caution
preview と production は**別々の Turso DB**（`TURSO_DATABASE_URL_PREVIEW` / `_PROD`）です。
翻訳を反映したい環境の認証情報を指定して、それぞれ実行してください。
:::

```bash
# 対象環境の Turso 認証情報を環境変数で渡す（apps/backend/.env に入れてもよい）
export TURSO_DATABASE_URL="libsql://<対象環境>.turso.io"
export TURSO_AUTH_TOKEN="<対象環境のトークン>"

# 1. まず件数だけ確認（書き込みなし）
pnpm --filter @saneatsu/backend db:backfill -- --dry-run

# 2. 問題なければ本実行（フラグ無し = 全対応言語 × 全対象）
pnpm --filter @saneatsu/backend db:backfill
```

その他のフラグ:

```bash
# 特定言語だけを対象にする（例: 韓国語）
pnpm --filter @saneatsu/backend db:backfill -- --target ko

# 動作確認用に各種の先頭 N 件だけ処理
pnpm --filter @saneatsu/backend db:backfill -- --target es --limit 3
```

対象と特性:

- **記事**: `status = "published"` のみ（新規作成時の自動翻訳が published 限定なのに合わせる）
- **ギャラリー画像**: ja 翻訳を持つ全件
- **タグ**: ja 翻訳を持つ全件（表示ラベル用途のため自然な訳語を生成）
- **冪等**: 記事・ギャラリーは `(id, language)` の upsert、タグは既存訳を除外してから挿入。
  途中で失敗しても再実行すれば「まだ無いぶん」だけ続きから埋まります。
- **レート制限**: Gemini 呼び出し間に約 1 秒の待機を入れています。

## 新しい言語を追加するときのチェックリスト

例として韓国語 `ko` を追加する場合の手順です。①〜④のコード変更を終えれば、
新規コンテンツの自動翻訳とバックフィルは `ko` を自動で処理します
（ハンドラ・バックフィルスクリプトは無改修）。

1. **i18n 設定** — `packages/i18n/src/config.ts`
   - `locales` に `"ko"` を追加
   - `bcp47ByLocale`（`ko-KR`）と `openGraphLocaleByLocale`（`ko_KR`）に 1 行ずつ追加
2. **UI 文言** — `packages/i18n/src/locales/ko.json` を新規作成（`en.json` と同じキー構成で全キー翻訳）
3. **DB enum** — 3 テーブルの `language` enum に `"ko"` を追加
   - `packages/db/src/schema/article_translations.ts`
   - `packages/db/src/schema/gallery-image-translations.ts`
   - `packages/db/src/schema/tag_translations.ts`
4. **翻訳サービス** — `apps/backend/src/services/gemini-translation/gemini-translation.ts`
   - `TARGET_LANGUAGES` に `"ko"` を追加
   - `TARGET_LANGUAGE_NAMES` と `translate-with-gemini.ts` の `SYSTEM_INSTRUCTION_BY_LANGUAGE` は
     `Record<TargetLanguage>` なので、追記漏れは TypeScript がビルドエラーで教えてくれる
5. **デプロイ** — PR を開いて preview 反映を確認 → main マージで production 反映
6. **バックフィル** — preview / production の各 Turso に対して `db:backfill --target ko` を実行

:::tip
`①③④` は「翻訳できる言語」の定義、`②` は UI 文言、`⑥` は既存コンテンツの反映です。
`⑤` のコードデプロイは自動ですが、`⑥` のバックフィルだけは環境ごとに手動で実行します。
:::
