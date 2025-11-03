import type { Metadata } from "next";

import { TagCreateForm } from "@/features/tag-management";

/**
 * タグ新規作成ページのメタデータ
 */
export const metadata: Metadata = {
	title: "タグ新規作成 | 管理画面",
	description: "新しいタグを作成します",
};

/**
 * タグ新規作成ページ
 *
 * @description
 * 新しいタグを作成するページ。
 * タグ作成フォームを表示する。
 */
export default function TagNewPage() {
	return <TagCreateForm />;
}
