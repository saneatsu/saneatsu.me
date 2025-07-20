import { apiClient } from "../lib/api-client";
import type { Article, PaginatedResponse } from "../types/api";

export const articlesService = {
	async getArticles(params?: {
		page?: number;
		limit?: number;
		lang?: string;
		tag?: string;
	}) {
		return apiClient.get<PaginatedResponse<Article>>("/articles", { params });
	},

	async getArticle(slug: string, lang?: string) {
		return apiClient.get<Article>(`/articles/${slug}`, {
			params: lang ? { lang } : undefined,
		});
	},
};