import { useQuery } from "@tanstack/react-query";
import { honoClient } from "../../../../shared/lib/hono-client";

type ErrorResponse = {
	error?: {
		message?: string;
	};
};

type ArticleWithTags = {
	id: number;
	slug: string;
	cfImageId: string | null;
	status: string;
	publishedAt: string | null;
	updatedAt: string;
	title: string | null;
	content: string | null;
	viewCount: number;
	tags: {
		id: number;
		slug: string;
		name: string | null;
	}[];
};

/**
 * 記事詳細取得フック（管理画面用）
 *
 * @description
 * 記事IDから記事詳細を取得するフック。
 * 管理画面で使用し、全ステータスの記事を取得可能。
 * タグ情報も含めて返却される。
 */
export const useGetById = (
	id: number,
	options?: {
		language?: "ja" | "en";
		enabled?: boolean;
		onSuccess?: (data: ArticleWithTags) => void;
		onError?: (error: Error) => void;
	}
) => {
	const { language = "ja", enabled = true, onSuccess, onError } = options || {};

	return useQuery({
		queryKey: ["article", id, language],
		queryFn: async () => {
			const response = await honoClient.api.articles.admin[":id"].$get({
				param: { id: String(id) },
				query: { lang: language },
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as ErrorResponse).error?.message || "記事の取得に失敗しました"
				);
			}

			const result = await response.json();
			if (onSuccess && result.data) {
				onSuccess(result.data);
			}
			return result.data;
		},
		enabled: enabled && id > 0,
		retry: false,
		throwOnError: (error) => {
			if (onError) {
				onError(error as Error);
			}
			return false;
		},
	});
};
