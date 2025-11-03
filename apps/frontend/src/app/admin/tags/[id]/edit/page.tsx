import type { Metadata } from "next";

import { TagEditPageContent } from "./tag-edit-page-content";

/**
 * タグ編集ページのメタデータ
 */
export const metadata: Metadata = {
	title: "タグ編集 | 管理画面",
	description: "タグを編集します",
};

/**
 * PagePropsの型定義
 */
interface PageProps {
	params: Promise<{
		id: string;
	}>;
}

/**
 * タグ編集ページ
 *
 * @description
 * 既存のタグを編集するページ。
 * URLパラメータからタグIDを取得し、対応するタグの編集フォームを表示する。
 * タグが存在しない場合は404ページを表示する。
 */
export default async function TagEditPage({ params }: PageProps) {
	const { id } = await params;
	return <TagEditPageContent id={id} />;
}
