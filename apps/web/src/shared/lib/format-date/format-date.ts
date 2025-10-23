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
