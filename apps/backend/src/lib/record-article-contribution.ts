import { dailyArticleContributions } from "@saneatsu/db";
import {
	calculateJapaneseCharDelta,
	toJstDateKey,
} from "@saneatsu/db/lib/contributions/contribution-aggregator";
import type { Database } from "@saneatsu/db/worker";
import { sql } from "drizzle-orm";

type RecordContributionOptions = {
	/** DBクライアント */
	db: Database;
	/** 更新前のタイトル＋本文（無ければnull） */
	previousText?: string | null;
	/** 更新後のタイトル＋本文（無い場合は更新対象外） */
	nextText?: string | null;
	/** イベント発生日時（デフォルトは現在） */
	eventDate?: Date;
};

export function buildContributionText(
	params: { title?: string | null; content?: string | null } = {}
): string | null {
	const parts: string[] = [];
	const { title, content } = params;

	if (typeof title === "string" && title.trim().length > 0) {
		parts.push(title);
	}

	if (typeof content === "string" && content.trim().length > 0) {
		parts.push(content);
	}

	return parts.length > 0 ? parts.join("\n") : null;
}

/**
 * 日次の執筆アクティビティを記録する
 */
export async function recordArticleContribution({
	db,
	previousText = null,
	nextText = null,
	eventDate = new Date(),
}: RecordContributionOptions) {
	if (typeof nextText !== "string" || nextText.length === 0) return;

	const charDelta = calculateJapaneseCharDelta(previousText, nextText);
	const dateKey = toJstDateKey(eventDate);

	const insertQuery = db.insert(dailyArticleContributions).values({
		date: dateKey,
		updates: 1,
		jaCharCount: charDelta,
	});

	if ("onConflictDoUpdate" in insertQuery) {
		await insertQuery.onConflictDoUpdate({
			target: dailyArticleContributions.date,
			set: {
				updates: sql`${dailyArticleContributions.updates} + 1`,
				jaCharCount: sql`${dailyArticleContributions.jaCharCount} + ${charDelta}`,
				updatedAt: sql`(datetime('now'))`,
			},
		});
	} else {
		await insertQuery;
	}
}
