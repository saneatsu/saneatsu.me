import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq, sql } from "drizzle-orm";
import type { z } from "zod";

import { getDatabase } from "@/lib/database";
import { extractHeadings } from "@/utils/markdown";
import type {
	getSuggestionsRoute,
	SuggestionItemSchema,
} from "./get-suggestions.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	GEMINI_API_KEY?: string;
};

type Handler = RouteHandler<typeof getSuggestionsRoute, { Bindings: Env }>;

/**
 * GET /api/articles/suggestions - Wiki Linkサジェスト取得
 *
 * @description
 * 1. DBクライアントを作成
 * 2. クエリパラメータを取得
 * 3. targetSlugが指定された場合、その記事の見出しのみを返す
 *    3.1. 指定された記事を取得
 *    3.2. 見出しを抽出
 *    3.3. 見出しから検索
 * 4. 通常の検索処理（targetSlugが指定されていない場合）
 *    4.1. 記事タイトルを検索
 *    4.2. 記事タイトルをサジェストに追加
 *    4.3. 記事コンテンツから見出しを抽出して検索
 *    4.4. 結果を制限して返す
 */
export const getSuggestions: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, articles, articleTranslations } =
			await getDatabase();
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. クエリパラメータを取得
		const query = c.req.query();
		const q = query.q || "";
		const lang = (query.lang === "en" ? "en" : "ja") as "ja" | "en";
		const limitStr = query.limit || "20";
		const limit = parseInt(limitStr || "20", 10);
		const targetSlug = query.targetSlug;

		// 3. targetSlugが指定された場合、その記事の見出しのみを返す
		if (targetSlug) {
			// 3.1. 指定された記事を取得
			const targetArticle = await db
				.select({
					slug: articles.slug,
					title: articleTranslations.title,
					content: articleTranslations.content,
				})
				.from(articles)
				.innerJoin(
					articleTranslations,
					and(
						eq(articles.id, articleTranslations.articleId),
						eq(articleTranslations.language, lang)
					)
				)
				.where(
					and(eq(articles.status, "published"), eq(articles.slug, targetSlug))
				)
				.limit(1);

			if (targetArticle.length === 0 || !targetArticle[0].content) {
				// 記事が見つからない場合は空の結果を返す
				return c.json(
					{
						suggestions: [],
						fromCache: false,
					},
					200
				);
			}

			const article = targetArticle[0];

			// 3.2. 見出しを抽出
			const headings = extractHeadings(article.content, 6); // 全レベルの見出しを取得

			const suggestions: Array<z.infer<typeof SuggestionItemSchema>> = [];

			// 3.3. 見出しから検索（クエリが空の場合は全見出しを返す）
			for (const heading of headings) {
				const matchesQuery =
					q === "" || heading.text.toLowerCase().includes(q.toLowerCase());
				if (matchesQuery) {
					suggestions.push({
						slug: article.slug,
						title: heading.text,
						type: "heading",
						headingLevel: heading.level,
						headingId: heading.id,
						articleTitle: article.title,
					});

					if (suggestions.length >= limit) break;
				}
			}

			return c.json(
				{
					suggestions,
					fromCache: false,
				},
				200
			);
		}

		// 4. 通常の検索処理（targetSlugが指定されていない場合）
		// 4.1. 記事タイトルを検索（公開済みのみ）
		const articleResults = await db
			.select({
				slug: articles.slug,
				title: articleTranslations.title,
				content: articleTranslations.content,
			})
			.from(articles)
			.innerJoin(
				articleTranslations,
				and(
					eq(articles.id, articleTranslations.articleId),
					eq(articleTranslations.language, lang)
				)
			)
			.where(
				and(
					eq(articles.status, "published"),
					sql`LOWER(${articleTranslations.title}) LIKE LOWER(${`%${q}%`})`
				)
			)
			.limit(limit);

		const suggestions: Array<z.infer<typeof SuggestionItemSchema>> = [];

		// 4.2. 記事タイトルをサジェストに追加
		for (const article of articleResults) {
			if (article.title) {
				suggestions.push({
					slug: article.slug,
					title: article.title,
					type: "article",
				});
			}
		}

		// 4.3. 記事コンテンツから見出しを抽出して検索
		if (suggestions.length < limit) {
			// すべての公開済み記事を取得（パフォーマンスの観点から制限）
			const allArticles = await db
				.select({
					slug: articles.slug,
					title: articleTranslations.title,
					content: articleTranslations.content,
				})
				.from(articles)
				.innerJoin(
					articleTranslations,
					and(
						eq(articles.id, articleTranslations.articleId),
						eq(articleTranslations.language, lang)
					)
				)
				.where(eq(articles.status, "published"))
				.limit(100); // パフォーマンスのため制限

			for (const article of allArticles) {
				if (!article.content || !article.title) continue;

				// 見出しを抽出
				const headings = extractHeadings(article.content, 3);

				// 見出しから検索（大文字小文字を無視）
				for (const heading of headings) {
					if (heading.text.toLowerCase().includes(q.toLowerCase())) {
						suggestions.push({
							slug: article.slug,
							title: heading.text,
							type: "heading",
							headingLevel: heading.level,
							headingId: heading.id,
							articleTitle: article.title,
						});

						if (suggestions.length >= limit) break;
					}
				}

				if (suggestions.length >= limit) break;
			}
		}

		// 4.4. 結果を制限して返す
		const limitedSuggestions = suggestions.slice(0, limit);

		return c.json(
			{
				suggestions: limitedSuggestions,
				fromCache: false, // 現在は常にfalse
			},
			200
		);
	} catch (error) {
		console.error("Error fetching suggestions:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch suggestions",
				},
			},
			500
		);
	}
};
