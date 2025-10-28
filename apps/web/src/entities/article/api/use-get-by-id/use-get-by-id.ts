import { useQuery } from "@tanstack/react-query";

import { useHonoClient } from "@/shared/lib";

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
	translations?: {
		ja: {
			title: string | null;
			content: string | null;
		};
		en: {
			title: string | null;
			content: string | null;
		};
	};
	tags: {
		id: number;
		slug: string;
		createdAt: string;
		updatedAt: string;
		articleCount: number;
		translations: {
			ja: string;
			en: string;
		};
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
		includeAllTranslations?: boolean;
		enabled?: boolean;
		onSuccess?: (data: ArticleWithTags) => void;
		onError?: (error: Error) => void;
	}
) => {
	const {
		language = "ja",
		includeAllTranslations = false,
		enabled = true,
		onSuccess,
		onError,
	} = options || {};
	const client = useHonoClient();

	return useQuery({
		queryKey: ["article", id, language, includeAllTranslations],
		queryFn: async () => {
			const response = await client.api.articles.admin[":id"].$get({
				param: { id: String(id) },
				query: { lang: language, includeAllTranslations },
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
