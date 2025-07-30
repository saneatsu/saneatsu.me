import type { Article, PaginatedResponse } from "../../../shared";
import { apiClient } from "../../../shared";

export const articlesService = {
	async getArticles(params?: {
		page?: number;
		limit?: number;
		lang?: string;
	}) {
		return apiClient.get<PaginatedResponse<Article>>("/articles", { params });
	},

	async getArticle(slug: string, lang?: string) {
		return apiClient.get<Article>(`/articles/${slug}`, {
			params: lang ? { lang } : undefined,
		});
	},
};
