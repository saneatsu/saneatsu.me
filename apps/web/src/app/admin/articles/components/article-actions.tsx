"use client";

import { Edit, Eye, FileEdit, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	deleteArticle,
	getErrorMessage,
	updateArticleStatus,
} from "../../../../shared/lib/api-client";
import type { Article } from "../../../../shared/types/article";
import { Button } from "../../../../shared/ui/button/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../../../shared/ui/dropdown-menu/dropdown-menu";

/**
 * 記事アクションコンポーネントのプロパティ
 */
interface ArticleActionsProps {
	/** 対象記事 */
	article: Article;
	/** アクション実行後のコールバック */
	onAction?: () => void;
}

/**
 * 記事アクションコンポーネント
 * 編集・削除・ステータス変更などのアクションを提供
 */
export function ArticleActions({ article, onAction }: ArticleActionsProps) {
	const [loading, setLoading] = useState(false);

	/**
	 * 記事ステータス更新
	 */
	const handleStatusUpdate = async (newStatus: string) => {
		if (loading) return;

		const confirmed = window.confirm(
			`記事「${article.title || article.slug}」のステータスを「${newStatus}」に変更しますか？`
		);

		if (!confirmed) return;

		setLoading(true);
		try {
			await updateArticleStatus(article.id, newStatus);
			onAction?.();
		} catch (error) {
			alert(`ステータス更新に失敗しました: ${getErrorMessage(error)}`);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * 記事削除
	 */
	const handleDelete = async () => {
		if (loading) return;

		const confirmed = window.confirm(
			`記事「${article.title || article.slug}」を削除しますか？この操作は取り消せません。`
		);

		if (!confirmed) return;

		setLoading(true);
		try {
			await deleteArticle(article.id);
			onAction?.();
		} catch (error) {
			alert(`削除に失敗しました: ${getErrorMessage(error)}`);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * 記事編集ページへ移動
	 */
	const handleEdit = () => {
		// 実際の実装では記事編集ページに遷移
		// window.location.href = `/admin/articles/${article.id}/edit`;
		alert("記事編集機能は実装予定です");
	};

	/**
	 * 記事プレビュー
	 */
	const handlePreview = () => {
		// 実際の実装では記事詳細ページに遷移
		// window.open(`/articles/${article.slug}`, '_blank');
		alert("記事プレビュー機能は実装予定です");
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
					<span className="sr-only">アクションメニューを開く</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{/* 基本アクション */}
				<DropdownMenuItem onClick={handleEdit}>
					<Edit className="mr-2 h-4 w-4" />
					編集
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handlePreview}>
					<Eye className="mr-2 h-4 w-4" />
					プレビュー
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				{/* ステータス変更 */}
				{article.status !== "published" && (
					<DropdownMenuItem
						onClick={() => handleStatusUpdate("published")}
						className="text-green-600"
					>
						<FileEdit className="mr-2 h-4 w-4" />
						公開する
					</DropdownMenuItem>
				)}

				{article.status !== "draft" && (
					<DropdownMenuItem
						onClick={() => handleStatusUpdate("draft")}
						className="text-yellow-600"
					>
						<FileEdit className="mr-2 h-4 w-4" />
						下書きに戻す
					</DropdownMenuItem>
				)}

				{article.status !== "archived" && (
					<DropdownMenuItem
						onClick={() => handleStatusUpdate("archived")}
						className="text-gray-600"
					>
						<FileEdit className="mr-2 h-4 w-4" />
						アーカイブ
					</DropdownMenuItem>
				)}

				<DropdownMenuSeparator />

				{/* 削除アクション */}
				<DropdownMenuItem
					onClick={handleDelete}
					className="text-red-600 focus:text-red-600"
				>
					<Trash2 className="mr-2 h-4 w-4" />
					削除
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
