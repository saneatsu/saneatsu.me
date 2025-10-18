import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { useGetAllTags } from "@/entities/tag";
import { TagUpdateForm } from "@/features/tag-management";

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
	params: {
		id: string;
	};
}

/**
 * タグ編集ページコンポーネント
 */
function TagEditPageContent({ params }: PageProps) {
	const tagId = Number.parseInt(params.id);

	// タグ一覧を取得
	const { data, isLoading, error } = useGetAllTags();

	// ローディング状態
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<p className="text-muted-foreground">読み込み中...</p>
			</div>
		);
	}

	// エラー状態
	if (error) {
		return (
			<div className="rounded-md border border-destructive bg-destructive/10 p-4">
				<p className="text-sm text-destructive">
					エラー: {(error as Error).message || "エラーが発生しました"}
				</p>
			</div>
		);
	}

	// IDでタグを検索
	const tag = data?.data.find((t) => t.id === tagId);

	// タグが見つからない場合
	if (!tag) {
		notFound();
	}

	return <TagUpdateForm tag={tag} />;
}

/**
 * タグ編集ページ
 *
 * @description
 * 既存のタグを編集するページ。
 * URLパラメータからタグIDを取得し、対応するタグの編集フォームを表示する。
 * タグが存在しない場合は404ページを表示する。
 */
export default function TagEditPage(props: PageProps) {
	return <TagEditPageContent {...props} />;
}
