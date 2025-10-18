import type { RouteHandler } from "@hono/zod-openapi";
import {
	articles,
	articleTags,
	articleTranslations,
	tags,
} from "@saneatsu/db/worker";
import { articleListQuerySchema, type SortOrder } from "@saneatsu/schemas";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import type { listArticlesRoute } from "./list-articles.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	GEMINI_API_KEY?: string;
};

type Handler = RouteHandler<typeof listArticlesRoute, { Bindings: Env }>;

/**
 * GET /api/articles - 記事一覧取得
 *
 * @description
 * 1. DBクライアントを作成
 * 2. クエリパラメータを検証・変換
 * 3. ページネーションの計算
 * 4. クエリ条件を構築（ステータス、検索）
 * 5. ソート条件を設定
 * 6. 記事一覧を取得（JOIN）
 * 7. 総記事数を取得
 * 8. レスポンスを返す
 */
export const listArticles: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. クエリパラメータを検証・変換
		const rawQuery = c.req.valid("query");
		const validatedQuery = articleListQuerySchema.parse(rawQuery);

		const {
			page,
			limit,
			language: lang,
			status,
			search,
			sortBy,
			sortOrder,
		} = validatedQuery;

		const order = sortOrder as SortOrder;

		// 3. ページネーションの計算
		const offset = (page - 1) * limit;

		// 4. クエリ条件を構築
		const conditions = [];

		// ステータス条件
		if (status) {
			conditions.push(eq(articles.status, status));
		}

		// 検索条件
		if (search) {
			conditions.push(
				sql`(
					${articleTranslations.title} LIKE ${`%${search}%`} OR
					${articleTranslations.content} LIKE ${`%${search}%`}
				)`
			);
		}

		// 5. ソート条件を設定
		let orderByClause: ReturnType<typeof asc | typeof desc>;
		switch (sortBy) {
			case "title":
				orderByClause =
					order === "asc"
						? asc(articleTranslations.title)
						: desc(articleTranslations.title);
				break;
			case "viewCount":
				orderByClause =
					order === "asc"
						? asc(articleTranslations.viewCount)
						: desc(articleTranslations.viewCount);
				break;
			case "publishedAt":
				orderByClause =
					order === "asc"
						? asc(articles.publishedAt)
						: desc(articles.publishedAt);
				break;
			case "updatedAt":
				orderByClause =
					order === "asc" ? asc(articles.updatedAt) : desc(articles.updatedAt);
				break;
			default:
				orderByClause =
					order === "asc" ? asc(articles.createdAt) : desc(articles.createdAt);
				break;
		}

		// 6. 記事一覧を取得
		const articleList = await db
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
			.where(and(...conditions))
			.orderBy(orderByClause)
			.limit(limit)
			.offset(offset);

		// 7. タグ情報を取得
		const articleIds = articleList.map((article) => article.id);
		let articleTagsData: Array<{
			articleId: number;
			tagId: number;
			tagSlug: string;
		}> = [];

		if (articleIds.length > 0) {
			articleTagsData = await db
				.select({
					articleId: articleTags.articleId,
					tagId: tags.id,
					tagSlug: tags.slug,
				})
				.from(articleTags)
				.innerJoin(tags, eq(articleTags.tagId, tags.id))
				.where(inArray(articleTags.articleId, articleIds));
		}

		// 8. 記事ごとにタグをグループ化
		const articleWithTags = articleList.map((article) => ({
			...article,
			tags: articleTagsData
				.filter((tag) => tag.articleId === article.id)
				.map((tag) => ({
					id: tag.tagId,
					slug: tag.tagSlug,
				})),
		}));

		// 9. 総記事数を取得
		const totalCount = await db
			.select({ count: articles.id })
			.from(articles)
			.leftJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(and(...conditions));

		// 10. レスポンスを返す
		return c.json(
			{
				data: articleWithTags,
				pagination: {
					page,
					limit,
					total: totalCount.length,
					totalPages: Math.ceil(totalCount.length / limit),
				},
			},
			200
		);
	} catch (error) {
		console.error("Error fetching articles:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch articles",
				},
			},
			500
		);
	}
};
