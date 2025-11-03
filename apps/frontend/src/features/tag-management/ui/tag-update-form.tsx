"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateTag } from "@/entities/tag";
import type { Tag } from "@/shared/model";
import { Button, Input, Label } from "@/shared/ui";

/**
 * タグ更新フォームのスキーマ
 */
const tagUpdateSchema = z.object({
	name: z
		.string()
		.min(1, "タグ名は必須です")
		.max(100, "タグ名は100文字以内で入力してください"),
	enName: z
		.string()
		.min(1, "英語のタグ名は1文字以上である必要があります")
		.max(100, "英語のタグ名は100文字以内で入力してください")
		.optional()
		.or(z.literal("")),
	slug: z
		.string()
		.min(1, "スラッグは必須です")
		.max(100, "スラッグは100文字以内で入力してください")
		.regex(
			/^[a-z0-9-]+$/,
			"スラッグは小文字の英数字とハイフンのみ使用できます"
		),
});

type TagUpdateForm = z.infer<typeof tagUpdateSchema>;

/**
 * TagUpdateFormコンポーネントのProps
 */
interface TagUpdateFormProps {
	/** 更新対象のタグ */
	tag: Tag;
}

/**
 * タグ更新フォームコンポーネント
 *
 * @description
 * 既存のタグを更新するためのフォーム。
 * 日本語タグ名、英語タグ名、スラッグフィールドを持つ。
 * 更新成功時にタグ一覧ページにリダイレクトする。
 */
export function TagUpdateForm({ tag }: TagUpdateFormProps) {
	const router = useRouter();
	const [formError, setFormError] = useState<string>("");

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TagUpdateForm>({
		resolver: zodResolver(tagUpdateSchema),
		defaultValues: {
			name: tag.translations.ja ?? "",
			enName: tag.translations.en ?? "",
			slug: tag.slug,
		},
	});

	// タグ更新フック
	const updateMutation = useUpdateTag();

	/**
	 * フォーム送信処理
	 *
	 * 1. エラーメッセージをクリア
	 * 2. タグを更新（日本語名、英語名、スラッグ）
	 * 3. 成功時にタグ一覧ページにリダイレクト
	 * 4. エラー時にエラーメッセージを表示
	 */
	const onSubmit = async (data: TagUpdateForm) => {
		try {
			setFormError(""); // エラーメッセージをクリア

			await updateMutation.mutateAsync({
				id: tag.id,
				name: data.name,
				enName: data.enName || undefined,
				slug: data.slug,
			});

			// 成功時にタグ一覧ページにリダイレクト
			router.push("/admin/tags");
		} catch (error) {
			// エラーメッセージをフォーム上部に表示
			if (error instanceof Error) {
				setFormError(error.message);
			} else {
				setFormError("タグの更新中にエラーが発生しました");
			}
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* エラーメッセージ */}
			{formError && (
				<div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md">
					<p className="text-sm text-destructive font-medium">
						エラーが発生しました
					</p>
					<p className="text-sm text-destructive mt-1">{formError}</p>
				</div>
			)}

			{/* タグ名（日本語） */}
			<div className="space-y-2">
				<Label htmlFor="name">タグ名（日本語） *</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="タイプスクリプト"
					className="max-w-md"
				/>
				{errors.name && (
					<p className="text-sm text-destructive">{errors.name.message}</p>
				)}
				<p className="text-sm text-muted-foreground">
					タグの表示名を日本語で入力してください
				</p>
			</div>

			{/* タグ名（英語） */}
			<div className="space-y-2">
				<Label htmlFor="enName">タグ名（英語）</Label>
				<Input
					id="enName"
					{...register("enName")}
					placeholder="TypeScript"
					className="max-w-md"
				/>
				{errors.enName && (
					<p className="text-sm text-destructive">{errors.enName.message}</p>
				)}
				<p className="text-sm text-muted-foreground">
					英語のタグ名を入力してください。未入力の場合は自動翻訳されます。
				</p>
			</div>

			{/* スラッグ */}
			<div className="space-y-2">
				<Label htmlFor="slug">スラッグ *</Label>
				<Input
					id="slug"
					{...register("slug")}
					placeholder="typescript"
					className="max-w-md"
				/>
				{errors.slug && (
					<p className="text-sm text-destructive">{errors.slug.message}</p>
				)}
				<p className="text-sm text-muted-foreground">
					小文字の英数字とハイフンのみ使用できます（例: typescript,
					web-development）
				</p>
			</div>

			{/* 送信ボタン */}
			<div className="flex gap-4">
				<Button type="submit" disabled={updateMutation.isPending}>
					{updateMutation.isPending ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							更新中...
						</>
					) : (
						"タグを更新"
					)}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push("/admin/tags")}
				>
					キャンセル
				</Button>
			</div>
		</form>
	);
}
