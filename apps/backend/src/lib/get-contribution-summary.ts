import { dailyArticleContributions } from "@saneatsu/db";
import { toJstDateKey } from "@saneatsu/db/lib/contributions/contribution-aggregator";
import type { Database } from "@saneatsu/db/worker";
import type { ContributionSummary } from "@saneatsu/schemas";
import { and, gte, lte } from "drizzle-orm";

// 表示可能な日数レンジのプリセット
export const CONTRIBUTION_RANGE_OPTIONS = [30, 90, 180, 365] as const;

// 1日分のミリ秒
const DAY_MS = 24 * 60 * 60 * 1000;

// 入力の範囲指定が不正な場合に安全な値へ丸める
const clampRange = (range?: number) => {
	if (!range || Number.isNaN(range)) return 365;
	return Math.min(Math.max(range, 1), 366);
};

// 現在日時から指定レンジ分のJST日付キーを生成する
const buildDateKeys = (rangeDays: number, now: Date) => {
	const keys: string[] = [];
	for (let i = rangeDays - 1; i >= 0; i -= 1) {
		const date = new Date(now.getTime() - i * DAY_MS);
		keys.push(toJstDateKey(date));
	}
	return keys;
};

/**
 * 指定した日数・現在日時をもとに執筆データ概要を計算する。
 * - 範囲外の日付は0埋め
 * - `rangeDays` が未指定／不正でも 365 日にフォールバック
 * - DBは JST 基準の日付キーで検索
 */
export async function getContributionSummary(
	db: Database,
	options: { rangeDays?: number; now?: Date } = {}
): Promise<ContributionSummary> {
	const rangeDays = clampRange(options.rangeDays);
	const now = options.now ?? new Date();

	// 可視化で使う365（or 366）日の連続キー
	const dateKeys = buildDateKeys(rangeDays, now);

	// 表示期間の開始・終了キー
	const startDate = dateKeys[0];
	const endDate = dateKeys[dateKeys.length - 1];

	const rows = await db
		.select({
			date: dailyArticleContributions.date,
			jaCharCount: dailyArticleContributions.jaCharCount,
			updatedAt: dailyArticleContributions.updatedAt,
		})
		.from(dailyArticleContributions)
		.where(
			and(
				gte(dailyArticleContributions.date, startDate),
				lte(dailyArticleContributions.date, endDate)
			)
		);

	const rowMap = new Map<string, (typeof rows)[number]>();
	for (const row of rows) {
		rowMap.set(row.date, row);
	}

	// 可視化用の1日単位データ
	const days = dateKeys.map((date) => {
		const row = rowMap.get(date);
		return {
			date,
			jaChars: row ? Number(row.jaCharCount) : 0,
		};
	});

	// 総文字数とヒートマップ濃度の上限
	const totalJaChars = days.reduce((sum, day) => sum + day.jaChars, 0);
	const maxJaChars = days.reduce((max, day) => Math.max(max, day.jaChars), 0);

	// 最新の更新日時（データ無しなら現在時刻を採用）
	const lastUpdated = rows.length
		? rows.reduce(
				(latest, row) => (row.updatedAt > latest ? row.updatedAt : latest),
				rows[0]?.updatedAt
			)
		: options.now
			? options.now.toISOString()
			: new Date().toISOString();

	return {
		startDate,
		endDate,
		totalJaChars,
		maxJaChars,
		days,
		lastUpdated,
	};
}
