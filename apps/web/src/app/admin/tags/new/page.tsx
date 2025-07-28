"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateTag } from "../../../../entities/tag";
import { Button } from "../../../../shared/ui/button/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../../shared/ui/card/card";
import { TagForm } from "../components/tag-form";

/**
 * タグ新規作成ページ
 */
export default function NewTagPage() {
	const router = useRouter();

	// タグ作成フック
	const { mutate: createTag, isPending } = useCreateTag({
		mutationConfig: {
			onSuccess: () => {
				// 成功時はタグ一覧に戻る
				router.push("/admin/tags");
			},
			onError: (error) => {
				// エラー時の処理（将来的にはトーストで表示）
				console.error("タグの作成に失敗しました:", error);
			},
		},
	});

	/**
	 * キャンセル処理
	 */
	const handleCancel = () => {
		router.push("/admin/tags");
	};

	return (
		<div className="space-y-6">
			{/* ヘッダー */}
			<div className="flex items-center gap-4">
				<Link href="/admin/tags">
					<Button variant="ghost" size="icon">
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>
				<div>
					<h2 className="text-2xl font-bold text-foreground">タグを作成</h2>
					<p className="text-muted-foreground">
						新しいタグを作成します。日本語と英語の両方の名前を設定してください。
					</p>
				</div>
			</div>

			{/* フォームカード */}
			<Card>
				<CardHeader>
					<CardTitle>タグ情報</CardTitle>
					<CardDescription>
						タグのスラッグと各言語での表示名を入力してください。
					</CardDescription>
				</CardHeader>
				<CardContent>
					<TagForm
						onSubmit={createTag}
						isSubmitting={isPending}
						onCancel={handleCancel}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
