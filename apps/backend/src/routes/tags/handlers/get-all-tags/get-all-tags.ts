import type { RouteHandler } from "@hono/zod-openapi";
import { desc, eq, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/database";
import type { getAllTagsRoute } from "./get-all-tags.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
};

type Handler = RouteHandler<typeof getAllTagsRoute, { Bindings: Env }>;

/**
 * GET /api/tags - タグ一覧取得
 *
 * @description
 * 1. DBクライアントを作成
 * 2. タグ一覧を取得
 * 3. 各タグの記事数をカウント
 * 4. レスポンスを返す
 */
export const getAllTags: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, articleTags, tags } = await getDatabase();
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. タグ一覧を取得（記事数も含める）
		// 更新日の降順でソート（最新のものが上に来る）
		const tagList = await db
			.select({
				id: tags.id,
				slug: tags.slug,
				createdAt: tags.createdAt,
				updatedAt: tags.updatedAt,
				articleCount: sql<number>`COUNT(DISTINCT ${articleTags.articleId})`,
			})
			.from(tags)
			.leftJoin(articleTags, eq(tags.id, articleTags.tagId))
			.groupBy(tags.id)
			.orderBy(desc(tags.updatedAt));

		// 3. レスポンスを返す
		return c.json(
			{
				data: tagList,
			},
			200
		);
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
};
