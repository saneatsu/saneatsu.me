import type { SimpleIcon } from "simple-icons";

import type { TechMeta } from "@/shared/config";
import { TECH_STACK } from "@/shared/config";

/**
 * 正規化した技術名（小文字）から技術メタ情報への索引
 *
 * @description
 * `TECH_STACK`（SSOT）のキーを小文字化してメタ情報を引けるようにした索引。
 * 経歴詳細の `techStack` は翻訳JSON由来の文字列で、型チェックが効かないため、
 * 大文字小文字のゆらぎを吸収して解決できるようにする。
 */
const TECH_META_LOOKUP: Record<string, TechMeta> = Object.fromEntries(
	Object.entries(TECH_STACK).map(([name, meta]) => [name.toLowerCase(), meta])
);

/**
 * 技術名から技術メタ情報（アイコン・背景色など）を取得する
 *
 * @description
 * 技術名（文字列）から `TECH_STACK`（SSOT）のメタ情報を取得する。
 * 大文字小文字を区別せず、前後の空白を除去して検索する。
 * 見つからない場合は undefined を返す。
 *
 * `getTechIcon` が SimpleIcon のみを返すのに対し、こちらは `renderIcon` や
 * `backgroundColor` も含むため、simple-iconsに無い技術（AWS・Playwright等）も
 * 正しくバッジ表示できる。
 *
 * @param techName - 技術名（例: "React", "AWS"）
 * @returns 対応する技術メタ情報、または見つからない場合は undefined
 */
export function getTechMeta(techName: string): TechMeta | undefined {
	const normalizedName = techName.toLowerCase().trim();
	return TECH_META_LOOKUP[normalizedName];
}

/**
 * 技術名からSimpleIconを取得する
 *
 * @description
 * 技術名（文字列）から対応するSimpleIconを取得する。
 * 大文字小文字を区別せず、`TECH_STACK`（SSOT）から検索する。
 * 見つからない、またはSimpleIconを持たない技術（renderIconで表示する技術）の場合は
 * undefined を返す。
 *
 * @param techName - 技術名（例: "Python", "React"）
 * @returns 対応するSimpleIcon、または存在しない場合は undefined
 */
export function getTechIcon(techName: string): SimpleIcon | undefined {
	return getTechMeta(techName)?.icon;
}
