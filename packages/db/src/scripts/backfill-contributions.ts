import dotenv from "dotenv";

dotenv.config();

/**
 * 既存の記事データから `daily_article_contributions` テーブルを再構築するバックフィルスクリプト。
 *
 * - articles / article_translations を走査し、最終更新日に日本語文字数を集計。
 * - ギャップが発生した場合にまとめてリセット → 再投入する用途を想定。
 * - `pnpm --filter @saneatsu/db db:backfill-contributions` で実行。
 */

import { createClient } from "@libsql/client";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import {
	countJapaneseCharactersFromMarkdown,
	toJstDateKey,
} from "../lib/contributions/contribution-aggregator";
import * as schema from "../schema";

async function main() {
	const url = process.env.TURSO_DATABASE_URL || "file:./local.db";
	const authToken = url.startsWith("file:")
		? undefined
		: process.env.TURSO_AUTH_TOKEN;

	const client = createClient({ url, authToken });
	const db = drizzle(client, { schema });

	console.log("🧹 Removing existing contribution rows...");
	await db.delete(schema.dailyArticleContributions);

	console.log("📊 Aggregating articles...");
	const rows = await db
		.select({
			content: schema.articleTranslations.content,
			updatedAt: schema.articles.updatedAt,
			createdAt: schema.articles.createdAt,
		})
		.from(schema.articles)
		.innerJoin(
			schema.articleTranslations,
			and(
				eq(schema.articleTranslations.articleId, schema.articles.id),
				eq(schema.articleTranslations.language, "ja")
			)
		);

	const bucket = new Map<string, { updates: number; jaChars: number }>();

	for (const row of rows) {
		if (!row.content) continue;
		const baseDate = row.updatedAt || row.createdAt || new Date().toISOString();
		const dateKey = toJstDateKey(new Date(baseDate));
		const charCount = countJapaneseCharactersFromMarkdown(row.content);

		const stats = bucket.get(dateKey) ?? { updates: 0, jaChars: 0 };
		stats.updates += 1;
		stats.jaChars += charCount;
		bucket.set(dateKey, stats);
	}

	console.log(`✏️  Writing ${bucket.size} daily rows...`);
	for (const [date, stats] of bucket) {
		await db.insert(schema.dailyArticleContributions).values({
			date,
			updates: stats.updates,
			jaCharCount: stats.jaChars,
		});
	}

	console.log("✅ Backfill complete");
	process.exit(0);
}

main().catch((error) => {
	console.error("❌ Backfill failed", error);
	process.exit(1);
});
