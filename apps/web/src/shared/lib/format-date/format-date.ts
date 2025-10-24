import type { Locale } from "../../config/locale-constants";

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
	/** 日数差（相対表示の場合のみ） */
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
 * 10日以内の場合は相対表示（日数差を返す）、それ以外は通常の日付形式で返す。
 * 翻訳はコンポーネント側でnext-intlを使用して行う。
 *
 * @example
 * // 3日前の場合（相対表示）
 * formatRelativeDate("2024-01-12T10:00:00.000Z", "ja")
 * // => { isRelative: true, days: 3 }
 *
 * // 15日前の場合（通常表示）
 * formatRelativeDate("2024-01-01T10:00:00.000Z", "ja")
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

		// 日数差を計算（時刻をリセットして日付のみで比較）
		// UTCベースで日付を比較してタイムゾーンの影響を受けないようにする
		const today = new Date(currentDate);
		today.setUTCHours(0, 0, 0, 0);

		const target = new Date(targetDate);
		target.setUTCHours(0, 0, 0, 0);

		const diffTime = today.getTime() - target.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		// 10日以内の場合は相対表示
		if (diffDays >= 0 && diffDays <= 10) {
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
