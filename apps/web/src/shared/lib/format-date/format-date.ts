import type { Locale } from "@saneatsu/i18n";

/**
 * ISO 8601形式の日時をdatetime-local形式に変換する
 *
 * @param isoString - ISO 8601形式の日時文字列（例: "2024-01-15T10:30:00.000Z"）
 * @returns datetime-local形式の文字列（例: "2024-01-15T10:30"）、nullの場合はundefinedを返す
 *
 * @description
 * datetime-local inputフィールドは "YYYY-MM-DDTHH:mm" 形式を要求するため、
 * ISO 8601形式からこの形式に変換する。
 * タイムゾーンはユーザーのローカルタイムゾーンに変換される。
 */
export function convertIsoToDatetimeLocal(
	isoString: string | null
): string | undefined {
	if (!isoString) return undefined;

	try {
		const date = new Date(isoString);

		// 無効な日付の場合はundefinedを返す
		if (Number.isNaN(date.getTime())) {
			return undefined;
		}

		// datetime-local形式に変換（YYYY-MM-DDTHH:mm）
		// タイムゾーンオフセットを考慮してローカル時刻を取得
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	} catch {
		return undefined;
	}
}

/**
 * 相対日付フォーマットの結果型
 */
export interface RelativeDateResult {
	/** 相対表示かどうか */
	isRelative: boolean;
	/** 分数差（1時間未満の場合） */
	minutes?: number;
	/** 時間差（24時間未満の場合） */
	hours?: number;
	/** 日数差（10日以内の場合） */
	days?: number;
	/** フォーマット済み日付文字列（通常表示の場合） */
	formatted?: string;
}

/**
 * ISO 8601形式の日時を相対日付形式に変換する
 *
 * @param isoString - ISO 8601形式の日時文字列（例: "2024-01-15T10:30:00.000Z"）
 * @param locale - ロケール（"ja" または "en"）
 * @param currentDate - 基準日（テスト用、省略時は現在日時）
 * @returns 相対日付の結果オブジェクト、nullの場合はundefinedを返す
 *
 * @description
 * 以下のロジックで相対日付を判定する：
 * - 1時間未満: 分数を返す
 * - 24時間未満: 時間数を返す
 * - 10日以内: 日数を返す
 * - それ以上: フォーマット済み日付文字列を返す
 *
 * 翻訳はコンポーネント側でnext-intlを使用して行う。
 *
 * @example
 * // 30分前の場合（相対表示）
 * formatRelativeDate("2024-01-15T09:30:00.000Z", "ja", new Date("2024-01-15T10:00:00.000Z"))
 * // => { isRelative: true, minutes: 30 }
 *
 * // 5時間前の場合（相対表示）
 * formatRelativeDate("2024-01-15T05:00:00.000Z", "ja", new Date("2024-01-15T10:00:00.000Z"))
 * // => { isRelative: true, hours: 5 }
 *
 * // 3日前の場合（相対表示）
 * formatRelativeDate("2024-01-12T10:00:00.000Z", "ja", new Date("2024-01-15T10:00:00.000Z"))
 * // => { isRelative: true, days: 3 }
 *
 * // 15日前の場合（通常表示）
 * formatRelativeDate("2024-01-01T10:00:00.000Z", "ja", new Date("2024-01-15T10:00:00.000Z"))
 * // => { isRelative: false, formatted: "2024年1月1日" }
 */
export function formatRelativeDate(
	isoString: string | null,
	locale: Locale,
	currentDate: Date = new Date()
): RelativeDateResult | undefined {
	if (!isoString) return undefined;

	try {
		const targetDate = new Date(isoString);

		// 無効な日付の場合はundefinedを返す
		if (Number.isNaN(targetDate.getTime())) {
			return undefined;
		}

		// 時間差を計算（ミリ秒単位）
		const diffTime = Math.abs(currentDate.getTime() - targetDate.getTime());
		const diffMinutes = Math.floor(diffTime / (1000 * 60));
		const diffHours = Math.floor(diffMinutes / 60);
		const diffDays = Math.floor(diffHours / 24);

		// 1時間未満の場合は分で返す
		if (diffMinutes < 60) {
			return {
				isRelative: true,
				minutes: diffMinutes,
			};
		}

		// 24時間未満の場合は時間で返す
		if (diffHours < 24) {
			return {
				isRelative: true,
				hours: diffHours,
			};
		}

		// 10日以内の場合は日数で返す
		if (diffDays <= 10) {
			return {
				isRelative: true,
				days: diffDays,
			};
		}

		// 10日より前の場合は通常の日付形式
		// LocaleをIntl.LocalesArgument形式に変換
		const localeCode = locale === "ja" ? "ja-JP" : "en-US";
		const formatted = targetDate.toLocaleDateString(localeCode, {
			year: "numeric",
			month: "long",
			day: "numeric",
		});

		return {
			isRelative: false,
			formatted,
		};
	} catch {
		return undefined;
	}
}
