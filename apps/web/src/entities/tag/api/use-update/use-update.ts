"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { queryKeys } from "../../../../shared/lib/query-keys";
import type { MutationConfig } from "../../../../shared/lib/react-query";
import type { TagDetail } from "../use-get-by-id";

/**
 * タグ更新のリクエスト型
 */
export interface UpdateTagInput {
	/** タグのスラッグ（英数字とハイフンのみ、更新する場合のみ） */
	slug?: string;
	/** 翻訳情報（日本語と英語の両方が必須） */
	translations: {
		/** 翻訳ID（既存の場合） */
		id?: number;
		/** タグ名 */
		name: string;
		/** 言語コード */
		language: "ja" | "en";
	}[];
}

/**
 * タグ更新のレスポンス型
 */
interface UpdateTagResponse {
	data: TagDetail;
}

/**
 * タグ更新のオプション
 */
type UseUpdateTagOptions = {
	/** 更新するタグのID */
	tagId: number;
	/** React Queryの設定 */
	mutationConfig?: MutationConfig<
		(data: UpdateTagInput) => Promise<UpdateTagResponse>
	>;
};

/**
 * タグ更新用のカスタムフック
 *
 * @param options - 更新オプション
 * @returns タグ更新のmutation
 *
 * @example
 * ```tsx
 * const { mutate: updateTag, isPending } = useUpdateTag({
 *   tagId: 1,
 *   mutationConfig: {
 *     onSuccess: () => {
 *       toast.success("タグを更新しました");
 *       router.push("/admin/tags");
 *     },
 *   },
 * });
 * ```
 */
export function useUpdateTag({
	tagId,
	mutationConfig = {},
}: UseUpdateTagOptions) {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: async (data: UpdateTagInput) => {
			const response = await fetch(`/api/tags/${tagId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("タグが見つかりません");
				}
				const error = await response.json();
				throw new Error(
					(error as { error?: { message?: string } }).error?.message ||
						"タグの更新に失敗しました"
				);
			}

			const result = await response.json();
			return result as UpdateTagResponse;
		},
		onSuccess: (data) => {
			// 個別タグのキャッシュを更新
			queryClient.setQueryData(queryKeys.tag.byId(tagId), { data: data.data });

			// タグ一覧のキャッシュを無効化
			queryClient.invalidateQueries({ queryKey: queryKeys.tag.all() });

			// 成功時のコールバックを実行
			mutationConfig.onSuccess?.(data);
		},
		...mutationConfig,
	});
}

/**
 * CreateTagInputからUpdateTagInputに変換するヘルパー関数
 * 編集時に既存の翻訳IDを含める必要がある
 */
export function createTagInputToUpdateTagInput(
	createInput: {
		slug: string;
		translations: { name: string; language: "ja" | "en" }[];
	},
	existingTag: TagDetail
): UpdateTagInput {
	return {
		slug: createInput.slug !== existingTag.slug ? createInput.slug : undefined,
		translations: createInput.translations.map((translation) => {
			// 既存の翻訳IDを探す
			const existingTranslation = existingTag.translations.find(
				(t) => t.language === translation.language
			);

			return {
				id: existingTranslation?.id,
				name: translation.name,
				language: translation.language,
			};
		}),
	};
}
