const NEWLINE_REGEX = /[\r\n]+/g;
const ZERO_WIDTH_REGEX = /[\u200D\uFE0E\uFE0F]/g;

/**
 * テキスト内の「実質的な」文字数を数える
 *
 * - Markdown構文なども含めフラットに文字を数える
 * - 改行はセルの幅を増やさないので除外
 * - Variation Selector など幅ゼロのコードポイントは除外
 */
export function countJapaneseCharactersFromMarkdown(markdown: string): number {
	const normalized = markdown
		.replace(NEWLINE_REGEX, "")
		.replace(ZERO_WIDTH_REGEX, "");

	return [...normalized].length;
}

/**
 * 前回との差分（負値は0にクリップ）
 */
export function calculateJapaneseCharDelta(
	prevContent: string | null,
	nextContent: string
): number {
	const prevCount = prevContent
		? countJapaneseCharactersFromMarkdown(prevContent)
		: 0;
	const nextCount = countJapaneseCharactersFromMarkdown(nextContent);

	return Math.max(0, nextCount - prevCount);
}

/**
 * 日付を JST の yyyy-mm-dd に正規化
 */
export function toJstDateKey(date: Date): string {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone: "Asia/Tokyo",
	});

	return formatter.format(date);
}
