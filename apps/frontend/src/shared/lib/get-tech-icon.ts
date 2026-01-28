import type { SimpleIcon } from "simple-icons";
import { siDjango, siDotnet, siPython } from "simple-icons";

/**
 * 技術名からSimpleIconへのマッピング
 *
 * @description
 * 技術名（表示名）からsimple-iconsのSimpleIconオブジェクトへのマッピング。
 * 大文字小文字を区別しない。
 */
const TECH_ICON_MAP: Record<string, SimpleIcon> = {
	python: siPython,
	django: siDjango,
	vba: siDotnet, // VBAは.NETの一部として扱う
};

/**
 * 技術名からSimpleIconを取得する
 *
 * @description
 * 技術名（文字列）から対応するSimpleIconを取得する。
 * 大文字小文字を区別せず、マッピングテーブルから検索する。
 * 見つからない場合は undefined を返す。
 *
 * @param techName - 技術名（例: "Python", "Django", "VBA"）
 * @returns 対応するSimpleIcon、または見つからない場合は undefined
 *
 * @example
 * ```ts
 * const icon = getTechIcon("Python"); // siPython
 * const icon2 = getTechIcon("VBA"); // siMicrosoftoffice
 * const icon3 = getTechIcon("Unknown"); // undefined
 * ```
 */
export function getTechIcon(techName: string): SimpleIcon | undefined {
	// 大文字小文字を区別せず、空白を除去して検索
	const normalizedName = techName.toLowerCase().trim();
	return TECH_ICON_MAP[normalizedName];
}
