"use client";

import { notFound } from "next/navigation";

import { useGetAllTags } from "@/entities/tag";
import { TagUpdateForm } from "@/features/tag-management";

/**
 * タグ編集ページのクライアントコンポーネント
 *
 * @description
 * タグ編集フォームを表示するクライアントコンポーネント。
 * サーバーコンポーネントからタグIDを受け取り、
 * タグ一覧を取得して該当するタグの編集フォームを表示する。
 */
export function TagEditPageContent({ id }: { id: string }) {
	const tagId = Number.parseInt(id, 10);

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
