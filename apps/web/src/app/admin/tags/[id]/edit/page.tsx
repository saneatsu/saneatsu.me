"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
	createTagInputToUpdateTagInput,
	getTagFormInitialValues,
	useGetTagById,
	useUpdateTag,
} from "../../../../../entities/tag";
import { Button } from "../../../../../shared/ui/button/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../../../shared/ui/card/card";
import { TagForm } from "../../components/tag-form";

/**
 * タグ編集ページ
 */
export default function EditTagPage() {
	const params = useParams();
	const router = useRouter();
	const tagId = Number(params.id);

	// タグ詳細を取得
	const {
		data: tagDetailResponse,
		isLoading,
		error,
	} = useGetTagById({
		id: tagId,
		queryConfig: {
			enabled: tagId > 0,
		},
	});

	// タグ更新フック
	const { mutate: updateTag, isPending } = useUpdateTag({
		tagId,
		mutationConfig: {
			onSuccess: () => {
				// 成功時はタグ一覧に戻る
				router.push("/admin/tags");
			},
			onError: (error) => {
				// エラー時の処理（将来的にはトーストで表示）
				console.error("タグの更新に失敗しました:", error);
			},
		},
	});

	/**
	 * キャンセル処理
	 */
	const handleCancel = () => {
		router.push("/admin/tags");
	};

	/**
	 * フォーム送信処理
	 */
	const handleSubmit = (
		formData: Parameters<typeof createTagInputToUpdateTagInput>[0]
	) => {
		if (!tagDetailResponse?.data) return;

		// CreateTagInput形式からUpdateTagInput形式に変換
		const updateData = createTagInputToUpdateTagInput(
			formData,
			tagDetailResponse.data
		);

		updateTag(updateData);
	};

	// ローディング状態
	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Link href="/admin/tags">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<h2 className="text-2xl font-bold text-foreground">タグを編集</h2>
						<p className="text-muted-foreground">読み込み中...</p>
					</div>
				</div>
			</div>
		);
	}

	// エラー状態
	if (error || !tagDetailResponse?.data) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Link href="/admin/tags">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<h2 className="text-2xl font-bold text-foreground">タグを編集</h2>
						<p className="text-destructive">
							{error?.message || "タグが見つかりません"}
						</p>
					</div>
				</div>
			</div>
		);
	}

	const tagDetail = tagDetailResponse.data;
	const initialValues = getTagFormInitialValues(tagDetail);

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
					<h2 className="text-2xl font-bold text-foreground">タグを編集</h2>
					<p className="text-muted-foreground">
						タグ「{initialValues.nameJa || initialValues.nameEn}」を編集します。
					</p>
				</div>
			</div>

			{/* フォームカード */}
			<Card>
				<CardHeader>
					<CardTitle>タグ情報</CardTitle>
					<CardDescription>
						タグのスラッグと各言語での表示名を編集してください。
					</CardDescription>
				</CardHeader>
				<CardContent>
					<TagForm
						initialValues={initialValues}
						onSubmit={handleSubmit}
						isSubmitting={isPending}
						onCancel={handleCancel}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
