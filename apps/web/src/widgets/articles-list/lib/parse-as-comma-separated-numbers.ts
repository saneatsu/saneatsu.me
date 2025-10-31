import { createParser } from "nuqs";

/**
 * カンマ区切りの数値文字列を配列にパースするカスタムパーサー
 *
 * @description
 * URLクエリパラメータとして保存される「1,2,3」のような文字列を
 * number配列 [1, 2, 3] に変換する。
 * 無効な値（空文字列、NaN）は自動的にフィルタリングされる。
 *
 * @example
 * ```ts
 * const [tagIds, setTagIds] = useQueryState(
 *   "tags",
 *   parseAsCommaSeparatedNumbers
 * );
 * // URL: ?tags=1,2,3
 * // tagIds: [1, 2, 3]
 * ```
 */
export const parseAsCommaSeparatedNumbers = createParser({
	/**
	 * クエリパラメータの文字列を数値配列にパース
	 *
	 * @param queryValue - URLクエリパラメータの値（例: "1,2,3"）
	 * @returns 数値配列（例: [1, 2, 3]）
	 */
	parse(queryValue) {
		return queryValue
			.split(",")
			.filter(Boolean)
			.map((id) => Number.parseInt(id, 10))
			.filter((id) => !Number.isNaN(id));
	},

	/**
	 * 数値配列をクエリパラメータの文字列にシリアライズ
	 *
	 * @param value - 数値配列（例: [1, 2, 3]）
	 * @returns カンマ区切りの文字列（例: "1,2,3"）
	 */
	serialize(value) {
		return value.join(",");
	},
}).withDefault([]);
