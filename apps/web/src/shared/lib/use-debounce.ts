import { useEffect, useState } from "react";

/**
 * デバウンス機能を提供するフック
 *
 * @description
 * 指定された値の変更を遅延させ、指定した時間内に新しい値が
 * 設定されなかった場合のみ更新されます。
 *
 * @param value - デバウンスしたい値
 * @param delay - 遅延時間（ミリ秒）
 * @returns デバウンスされた値
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // API呼び出しなど
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		// 指定した遅延時間後にdebouncedValueを更新するタイマーを設定
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		// cleanup関数でタイマーをクリア
		// 新しい値が設定された場合、前のタイマーをキャンセル
		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}
