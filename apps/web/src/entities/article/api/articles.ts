import { apiClient } from "../../../shared";
import type { Article, PaginatedResponse } from "../../../shared";

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
