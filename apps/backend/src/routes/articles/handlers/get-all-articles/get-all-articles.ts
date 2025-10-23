import type { RouteHandler } from "@hono/zod-openapi";
import { articleListQuerySchema, type SortOrder } from "@saneatsu/schemas";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/database";
import type { Env } from "@/types/env";

import type { getAllArticlesRoute } from "./get-all-articles.openapi";

type Handler = RouteHandler<typeof getAllArticlesRoute, { Bindings: Env }>;

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
export const getAllArticles: Handler = async (c) => {
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
		if (status && status.length > 0) {
			conditions.push(inArray(articles.status, status));
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
					order === "asc" ? asc(articles.viewCount) : desc(articles.viewCount);
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
				viewCount: articles.viewCount,
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
			tagCreatedAt: string;
			tagUpdatedAt: string;
			tagName: string;
			tagLanguage: string;
		}> = [];

		if (articleIds.length > 0) {
			articleTagsData = await db
				.select({
					articleId: articleTags.articleId,
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
				.where(inArray(articleTags.articleId, articleIds));
		}

		// 8. 記事ごとにタグをグループ化
		const articleWithTags = articleList.map((article) => {
			// この記事のタグデータを取得
			const articleTags = articleTagsData.filter(
				(tag) => tag.articleId === article.id
			);

			// タグIDごとにグループ化して翻訳情報をまとめる
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

			for (const tagData of articleTags) {
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

			return {
				...article,
				tags: Array.from(tagsMap.values()),
			};
		});

		// 9. 総記事数を取得（DISTINCT countで重複を除いて正しくカウント）
		const totalCountResult = await db
			.select({ count: sql<number>`COUNT(DISTINCT ${articles.id})` })
			.from(articles)
			.leftJoin(
				articleTranslations,
				and(
					eq(articles.id, articleTranslations.articleId),
					eq(articleTranslations.language, lang)
				)
			)
			.where(and(...conditions));

		const totalArticles = Number(totalCountResult[0]?.count) || 0;

		// 10. レスポンスを返す
		return c.json(
			{
				data: articleWithTags,
				pagination: {
					page,
					limit,
					total: totalArticles,
					totalPages: Math.ceil(totalArticles / limit),
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
