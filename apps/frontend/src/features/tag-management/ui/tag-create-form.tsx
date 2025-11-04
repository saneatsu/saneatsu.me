"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCreateTag } from "@/entities/tag";
import { Button, Input, Label } from "@/shared/ui";

/**
 * タグ作成フォームのスキーマ
 */
const tagCreateSchema = z.object({
	name: z
		.string()
		.min(1, "タグ名は必須です")
		.max(100, "タグ名は100文字以内で入力してください"),
	slug: z
		.string()
		.min(1, "スラッグは必須です")
		.max(100, "スラッグは100文字以内で入力してください")
		.regex(
			/^[a-z0-9-]+$/,
			"スラッグは小文字の英数字とハイフンのみ使用できます"
		),
});

type TagCreateForm = z.infer<typeof tagCreateSchema>;

/**
 * タグ作成フォームコンポーネント
 *
 * @description
 * 新しいタグを作成するためのフォーム。
 * 日本語タグ名とスラッグフィールドを持つ。
 * 作成成功時にタグ一覧ページにリダイレクトする。
 */
export function TagCreateForm() {
	const router = useRouter();
	const [formError, setFormError] = useState<string>("");

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TagCreateForm>({
		resolver: zodResolver(tagCreateSchema),
		defaultValues: {
			name: "",
			slug: "",
		},
	});

	// タグ作成フック
	const createMutation = useCreateTag();

	/**
	 * フォーム送信処理
	 *
	 * 1. エラーメッセージをクリア
	 * 2. タグを作成（日本語名とスラッグ）
	 * 3. 成功時にタグ一覧ページにリダイレクト
	 * 4. エラー時にエラーメッセージを表示
	 */
	const onSubmit = async (data: TagCreateForm) => {
		try {
			setFormError(""); // エラーメッセージをクリア

			await createMutation.mutateAsync({
				name: data.name,
				slug: data.slug,
			});

			// 成功時にタグ一覧ページにリダイレクト
			router.push("/admin/tags");
		} catch (error) {
			// エラーメッセージをフォーム上部に表示
			if (error instanceof Error) {
				setFormError(error.message);
			} else {
				setFormError("タグの作成中にエラーが発生しました");
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
			<div className="flex justify-end space-x-4">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push("/admin/tags")}
				>
					キャンセル
				</Button>
				<Button type="submit" disabled={createMutation.isPending}>
					{createMutation.isPending ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							作成中...
						</>
					) : (
						"作成"
					)}
				</Button>
			</div>
		</form>
	);
}
