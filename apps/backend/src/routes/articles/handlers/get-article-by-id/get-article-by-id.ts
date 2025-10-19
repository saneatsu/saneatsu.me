import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/database";
import type { getArticleByIdRoute } from "./get-article-by-id.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	GEMINI_API_KEY?: string;
};

type Handler = RouteHandler<typeof getArticleByIdRoute, { Bindings: Env }>;

/**
 * GET /api/articles/admin/:id - 管理画面用記事詳細取得
 *
 * @description
 * 1. DBクライアントを作成
 * 2. パラメータを取得・検証
 * 3. 記事詳細を取得（ステータスに関わらず）
 * 4. 記事が見つからない場合は404
 * 5. タグ情報を取得
 * 6. レスポンスを返す
 */
export const getArticleById: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const {
			createDatabaseClient,
			articles,
			articleTags,
			articleTranslations,
			tagTranslations,
			tags,
		} = await getDatabase();
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. パラメータを取得・検証
		const { id } = c.req.valid("param");
		const { lang = "ja" } = c.req.valid("query");

		const articleId = parseInt(id);
		if (Number.isNaN(articleId)) {
			return c.json(
				{
					error: {
						code: "INVALID_ID",
						message: "Invalid article ID",
					},
				},
				400
			);
		}

		// 3. 記事詳細を取得（ステータスに関わらず）
		const article = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				cfImageId: articles.cfImageId,
				status: articles.status,
				publishedAt: articles.publishedAt,
				updatedAt: articles.updatedAt,
				title: articleTranslations.title,
				content: articleTranslations.content,
				viewCount: sql<number>`COALESCE(${articleTranslations.viewCount}, 0)`,
			})
			.from(articles)
			.leftJoin(
				articleTranslations,
				and(
					eq(articles.id, articleTranslations.articleId),
					eq(articleTranslations.language, lang)
				)
			)
			.where(eq(articles.id, articleId))
			.limit(1);

		// 4. 記事が見つからない場合は404
		if (article.length === 0) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Article not found",
					},
				},
				404
			);
		}

		const articleData = article[0];

		// 5. タグ情報を取得
		const articleTagsData = await db
			.select({
				tagId: tags.id,
				tagSlug: tags.slug,
				tagCreatedAt: tags.createdAt,
				tagUpdatedAt: tags.updatedAt,
				tagName: tagTranslations.name,
				tagLanguage: tagTranslations.language,
			})
			.from(articleTags)
			.innerJoin(tags, eq(articleTags.tagId, tags.id))
			.innerJoin(tagTranslations, eq(tags.id, tagTranslations.tagId))
			.where(eq(articleTags.articleId, articleId));

		// 6. タグの翻訳情報をグループ化
		const tagsMap = new Map<
			number,
			{
				id: number;
				slug: string;
				createdAt: string;
				updatedAt: string;
				articleCount: number;
				translations: { ja: string; en: string };
			}
		>();

		for (const tagData of articleTagsData) {
			if (!tagsMap.has(tagData.tagId)) {
				tagsMap.set(tagData.tagId, {
					id: tagData.tagId,
					slug: tagData.tagSlug,
					createdAt: tagData.tagCreatedAt,
					updatedAt: tagData.tagUpdatedAt,
					articleCount: 0,
					translations: { ja: "", en: "" },
				});
			}

			const tag = tagsMap.get(tagData.tagId);
			if (!tag) continue;
			if (tagData.tagLanguage === "ja") {
				tag.translations.ja = tagData.tagName;
			} else if (tagData.tagLanguage === "en") {
				tag.translations.en = tagData.tagName;
			}
		}

		// 7. レスポンスを返す
		return c.json(
			{
				data: {
					...articleData,
					tags: Array.from(tagsMap.values()),
				},
			},
			200
		);
	} catch (error) {
		console.error("Error fetching article:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch article",
				},
			},
			500
		);
	}
};
