"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type { MutationConfig } from "../../../../shared/lib/react-query";

/**
 * タグ作成のリクエスト型
 */
export interface CreateTagInput {
	/** タグのスラッグ（英数字とハイフンのみ） */
	slug: string;
	/** 翻訳情報（日本語と英語の両方が必須） */
	translations: {
		/** タグ名 */
		name: string;
		/** 言語コード */
		language: "ja" | "en";
	}[];
}

/**
 * タグ作成のレスポンス型
 */
interface CreateTagResponse {
	id: number;
	slug: string;
	createdAt: string;
	updatedAt: string;
	translations: {
		id: number;
		name: string;
		language: "ja" | "en";
		tagId: number;
	}[];
}

/**
 * タグ作成のオプション
 */
type UseCreateTagOptions = {
	/** React Queryの設定 */
	mutationConfig?: MutationConfig<(data: CreateTagInput) => Promise<CreateTagResponse>>;
};

/**
 * タグ作成用のカスタムフック
 *
 * @param options - 作成オプション
 * @returns タグ作成のmutation
 *
 * @example
 * ```tsx
 * const { mutate: createTag, isPending } = useCreateTag({
 *   mutationConfig: {
 *     onSuccess: () => {
 *       toast.success("タグを作成しました");
 *       router.push("/admin/tags");
 *     },
 *   },
 * });
 * ```
 */
export function useCreateTag({
	mutationConfig = {},
}: UseCreateTagOptions = {}) {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: async (data: CreateTagInput) => {
			const response = await fetch("/api/tags", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as { error?: { message?: string } }).error?.message ||
						"タグの作成に失敗しました"
				);
			}

			const result = await response.json();
			return result as CreateTagResponse;
		},
		onSuccess: (data) => {
			// タグ一覧のキャッシュを無効化
			queryClient.invalidateQueries({ queryKey: queryKeys.tag.all() });
			
			// 成功時のコールバックを実行
			mutationConfig.onSuccess?.(data);
		},
		...mutationConfig,
	});
}