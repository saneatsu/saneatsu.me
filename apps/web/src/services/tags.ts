import { apiClient } from "../lib/api-client";
import type { Article, PaginatedResponse, Tag } from "../types/api";

export const tagsService = {
	async getTags(lang?: string) {
		return apiClient.get<Tag[]>("/tags", {
			params: lang ? { lang } : undefined,
		});
	},

	async getTagArticles(
		slug: string,
		params?: {
			page?: number;
			limit?: number;
			lang?: string;
		}
	) {
		return apiClient.get<PaginatedResponse<Article>>(`/tags/${slug}/articles`, {
			params,
		});
	},
};
