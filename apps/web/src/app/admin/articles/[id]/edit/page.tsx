"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useGetById } from "@/entities/article";
import { ArticleEditForm } from "@/features/article-management";

/**
 * 記事編集ページ
 *
 * @description
 * 記事IDをURLパラメータから取得し、
 * 記事データをフェッチして編集フォームに渡す。
 * 更新成功後は記事一覧へリダイレクトする。
 */
export default function ArticleEditPage() {
	const params = useParams();
	const articleId = parseInt(params.id as string);

	// 記事データを取得
	const { data: article, isLoading, error } = useGetById(articleId);

	// ローディング中
	if (isLoading) {
		return (
			<div className="container mx-auto py-6">
				<div className="flex items-center justify-center h-96">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			</div>
		);
	}

	// エラー処理
	if (error || !article) {
		return (
			<div className="container mx-auto py-6">
				<div className="bg-destructive/10 border border-destructive rounded-lg p-6">
					<h2 className="text-lg font-semibold text-destructive mb-2">
						エラーが発生しました
					</h2>
					<p className="text-muted-foreground">
						{error?.message || "記事が見つかりませんでした"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6">
			<ArticleEditForm article={article} />
		</div>
	);
}
