"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { extractErrorMessage, useHonoClient } from "@/shared/lib";

/**
 * 警告メッセージの型
 */
type Warning = {
	code: string;
	message: string;
};

/**
 * 記事更新レスポンスの型
 */
type UpdateArticleResponse = {
	data: {
		id: number;
		slug: string;
		cfImageId: string | null;
		status: string;
		publishedAt: string | null;
		updatedAt: string;
		title: string | null;
		content: string | null;
		viewCount: number;
	};
	message: string;
	warnings?: Warning[];
};

/**
 * 記事更新用フック
 *
 * @description
 * 記事を更新するフック。
 * 成功時はキャッシュをクリアして最新データを取得する。
 */
export const useUpdate = () => {
	const queryClient = useQueryClient();
	const client = useHonoClient();

	return useMutation<
		UpdateArticleResponse,
		Error,
		{
			id: number;
			data: {
				title: string;
				slug: string;
				content: string;
				status: "draft" | "published" | "archived";
				publishedAt?: string;
				tagIds?: number[];
			};
		}
	>({
		mutationFn: async ({ id, data }) => {
			const response = await client.api.articles[":id"].$put({
				param: { id: String(id) },
				json: data,
			});

			if (!response.ok) {
				const errorData = await response.json();
				const errorMessage = extractErrorMessage(
					errorData,
					"記事の更新に失敗しました"
				);
				throw new Error(errorMessage);
			}

			return await response.json();
		},
		onSuccess: () => {
			// 記事一覧と記事詳細のキャッシュをクリア
			queryClient.invalidateQueries({ queryKey: ["articles"] });
			queryClient.invalidateQueries({ queryKey: ["article"] });
		},
		onError: (error: Error) => {
			console.error("Failed to update article:", error);
		},
	});
};
