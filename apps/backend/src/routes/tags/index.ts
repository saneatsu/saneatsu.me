import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
	articles,
	articleTags,
	articleTranslations,
	db,
	tags,
	tagTranslations,
} from "@saneatsu/db";
import { and, eq, sql } from "drizzle-orm";
import {
	CreateTagRequestSchema,
	ErrorSchema,
	TagArticlesParamSchema,
	TagArticlesQuerySchema,
	TagArticlesResponseSchema,
	TagDetailResponseSchema,
	TagIdParamSchema,
	TagsQuerySchema,
	TagsResponseSchema,
	UpdateTagRequestSchema,
} from "./schema";

/**
 * タグ関連のAPIルート
 */
export const tagsRoute = new OpenAPIHono();

/**
 * タグ一覧取得のルート定義
 */
const listTagsRoute = createRoute({
	method: "get",
	path: "/",
	request: {
		query: TagsQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TagsResponseSchema,
				},
			},
			description: "タグ一覧の取得成功",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Tags"],
	summary: "タグ一覧取得",
	description: "全てのタグとそれぞれの記事数を取得します。",
});

/**
 * GET /api/tags - タグ一覧取得
 */
tagsRoute.openapi(listTagsRoute, (async (c: any) => {
	try {
		const { lang = "ja" } = c.req.valid("query");

		// タグ一覧と記事数を取得
		const tagList = await db
			.select({
				id: tags.id,
				slug: tags.slug,
				name: tagTranslations.name,
				articleCount: sql<number>`COUNT(DISTINCT ${articleTags.articleId})`,
			})
			.from(tags)
			.leftJoin(tagTranslations, eq(tags.id, tagTranslations.tagId))
			.leftJoin(articleTags, eq(tags.id, articleTags.tagId))
			.where(eq(tagTranslations.language, lang as "ja" | "en"))
			.groupBy(tags.id, tagTranslations.name);

		return c.json({
			data: tagList,
		});
	} catch (error) {
		console.error("Error fetching tags:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch tags",
				},
			},
			500
		);
	}
}) as any);

/**
 * タグ別記事一覧取得のルート定義
 */
const getTagArticlesRoute = createRoute({
	method: "get",
	path: "/:slug/articles",
	request: {
		params: TagArticlesParamSchema,
		query: TagArticlesQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TagArticlesResponseSchema,
				},
			},
			description: "タグ別記事一覧の取得成功",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "タグが見つからない",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Tags"],
	summary: "タグ別記事一覧取得",
	description:
		"指定されたタグに紐づく記事一覧を取得します。ページネーションと言語フィルタリングに対応しています。",
});

/**
 * GET /api/tags/:slug/articles - タグ別記事一覧取得
 */
tagsRoute.openapi(getTagArticlesRoute, (async (c: any) => {
	try {
		const { slug } = c.req.valid("param");
		const {
			page: pageStr = "1",
			limit: limitStr = "10",
			lang = "ja",
		} = c.req.valid("query");
		const page = Number(pageStr);
		const limit = Number(limitStr);

		// ページネーションの計算
		const offset = (page - 1) * limit;

		// タグIDを取得
		const tag = await db
			.select({ id: tags.id })
			.from(tags)
			.where(eq(tags.slug, slug))
			.limit(1);

		if (tag.length === 0) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Tag not found",
					},
				},
				404
			);
		}

		// タグに紐づく記事一覧を取得
		const articleList = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				cfImageId: articles.cfImageId,
				status: articles.status,
				publishedAt: articles.publishedAt,
				title: articleTranslations.title,
				content: articleTranslations.content,
			})
			.from(articles)
			.innerJoin(articleTags, eq(articles.id, articleTags.articleId))
			.leftJoin(
				articleTranslations,
				eq(articles.id, articleTranslations.articleId)
			)
			.where(
				and(
					eq(articleTags.tagId, tag[0].id),
					eq(articles.status, "published"),
					eq(articleTranslations.language, lang as "ja" | "en")
				)
			)
			.limit(limit)
			.offset(offset);

		// 総記事数を取得
		const totalCount = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(articles)
			.innerJoin(articleTags, eq(articles.id, articleTags.articleId))
			.where(
				and(eq(articleTags.tagId, tag[0].id), eq(articles.status, "published"))
			);

		return c.json({
			data: articleList,
			pagination: {
				page,
				limit,
				total: totalCount[0].count,
				totalPages: Math.ceil(totalCount[0].count / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching tag articles:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch tag articles",
				},
			},
			500
		);
	}
}) as any);

/**
 * タグ個別取得のルート定義
 */
const getTagRoute = createRoute({
	method: "get",
	path: "/:id",
	request: {
		params: TagIdParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TagDetailResponseSchema,
				},
			},
			description: "タグの取得成功",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "タグが見つかりません",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Tags"],
	summary: "タグ個別取得",
	description: "指定されたIDのタグを翻訳情報と共に取得します。",
});

/**
 * GET /api/tags/:id - タグ個別取得
 */
tagsRoute.openapi(getTagRoute, (async (c: any) => {
	try {
		const { id } = c.req.valid("param");

		// タグと翻訳情報を取得
		const tagData = await db
			.select()
			.from(tags)
			.where(eq(tags.id, Number(id)))
			.limit(1);

		if (tagData.length === 0) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Tag not found",
					},
				},
				404
			);
		}

		// 翻訳情報を取得
		const translationsData = await db
			.select()
			.from(tagTranslations)
			.where(eq(tagTranslations.tagId, Number(id)));

		return c.json({
			data: {
				...tagData[0],
				translations: translationsData,
			},
		});
	} catch (error) {
		console.error("Error fetching tag:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch tag",
				},
			},
			500
		);
	}
}) as any);

/**
 * タグ作成のルート定義
 */
const createTagRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateTagRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: TagDetailResponseSchema,
				},
			},
			description: "タグの作成成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "リクエストエラー",
		},
		409: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "スラッグが重複しています",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Tags"],
	summary: "タグ作成",
	description: "新しいタグを日本語と英語の翻訳と共に作成します。",
});

/**
 * POST /api/tags - タグ作成
 */
tagsRoute.openapi(createTagRoute, (async (c: any) => {
	try {
		const { slug, translations } = c.req.valid("json");

		// スラッグの重複チェック
		const existingTag = await db
			.select()
			.from(tags)
			.where(eq(tags.slug, slug))
			.limit(1);

		if (existingTag.length > 0) {
			return c.json(
				{
					error: {
						code: "DUPLICATE_SLUG",
						message: "Slug already exists",
					},
				},
				409
			);
		}

		// トランザクション内でタグと翻訳を作成
		const newTag = await db.transaction(async (tx) => {
			// タグを作成
			const insertedTag = await tx.insert(tags).values({ slug }).returning();

			const tagId = insertedTag[0].id;

			// 翻訳を作成
			const translationData = translations.map((t: any) => ({
				...t,
				tagId,
			}));

			const insertedTranslations = await tx
				.insert(tagTranslations)
				.values(translationData)
				.returning();

			return {
				...insertedTag[0],
				translations: insertedTranslations,
			};
		});

		return c.json({ data: newTag }, 201);
	} catch (error) {
		console.error("Error creating tag:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to create tag",
				},
			},
			500
		);
	}
}) as any);

/**
 * タグ更新のルート定義
 */
const updateTagRoute = createRoute({
	method: "put",
	path: "/:id",
	request: {
		params: TagIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: UpdateTagRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TagDetailResponseSchema,
				},
			},
			description: "タグの更新成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "リクエストエラー",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "タグが見つかりません",
		},
		409: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "スラッグが重複しています",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Tags"],
	summary: "タグ更新",
	description: "指定されたIDのタグを更新します。",
});

/**
 * PUT /api/tags/:id - タグ更新
 */
tagsRoute.openapi(updateTagRoute, (async (c: any) => {
	try {
		const { id } = c.req.valid("param");
		const { slug, translations } = c.req.valid("json");

		// タグの存在確認
		const existingTag = await db
			.select()
			.from(tags)
			.where(eq(tags.id, Number(id)))
			.limit(1);

		if (existingTag.length === 0) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Tag not found",
					},
				},
				404
			);
		}

		// スラッグを更新する場合の重複チェック
		if (slug && slug !== existingTag[0].slug) {
			const duplicateTag = await db
				.select()
				.from(tags)
				.where(eq(tags.slug, slug))
				.limit(1);

			if (duplicateTag.length > 0) {
				return c.json(
					{
						error: {
							code: "DUPLICATE_SLUG",
							message: "Slug already exists",
						},
					},
					409
				);
			}
		}

		// トランザクション内で更新
		const updatedTag = await db.transaction(async (tx) => {
			// タグを更新
			if (slug) {
				await tx
					.update(tags)
					.set({ slug, updatedAt: sql`datetime('now')` })
					.where(eq(tags.id, Number(id)));
			}

			// 翻訳を更新
			if (translations) {
				// 既存の翻訳を削除
				await tx
					.delete(tagTranslations)
					.where(eq(tagTranslations.tagId, Number(id)));

				// 新しい翻訳を作成
				const translationData = translations.map((t: any) => ({
					...t,
					tagId: Number(id),
				}));

				await tx.insert(tagTranslations).values(translationData);
			}

			// 更新されたデータを取得
			const updatedTagData = await tx
				.select()
				.from(tags)
				.where(eq(tags.id, Number(id)))
				.limit(1);

			const translationsData = await tx
				.select()
				.from(tagTranslations)
				.where(eq(tagTranslations.tagId, Number(id)));

			return {
				...updatedTagData[0],
				translations: translationsData,
			};
		});

		return c.json({ data: updatedTag });
	} catch (error) {
		console.error("Error updating tag:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to update tag",
				},
			},
			500
		);
	}
}) as any);

/**
 * タグ削除のルート定義
 */
const deleteTagRoute = createRoute({
	method: "delete",
	path: "/:id",
	request: {
		params: TagIdParamSchema,
	},
	responses: {
		204: {
			description: "タグの削除成功",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "タグが見つかりません",
		},
		409: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "使用中のタグは削除できません",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Tags"],
	summary: "タグ削除",
	description:
		"指定されたIDのタグを削除します。記事に使用されているタグは削除できません。",
});

/**
 * DELETE /api/tags/:id - タグ削除
 */
tagsRoute.openapi(deleteTagRoute, (async (c: any) => {
	try {
		const { id } = c.req.valid("param");

		// タグの存在確認
		const existingTag = await db
			.select()
			.from(tags)
			.where(eq(tags.id, Number(id)))
			.limit(1);

		if (existingTag.length === 0) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Tag not found",
					},
				},
				404
			);
		}

		// 使用中のタグかチェック
		const tagUsage = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(articleTags)
			.where(eq(articleTags.tagId, Number(id)));

		if (tagUsage[0].count > 0) {
			return c.json(
				{
					error: {
						code: "TAG_IN_USE",
						message: "Cannot delete tag that is in use",
					},
				},
				409
			);
		}

		// タグを削除（翻訳もカスケードで削除される）
		await db.delete(tags).where(eq(tags.id, Number(id)));

		return c.body(null, 204);
	} catch (error) {
		console.error("Error deleting tag:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to delete tag",
				},
			},
			500
		);
	}
}) as any);
