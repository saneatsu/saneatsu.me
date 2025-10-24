import type { RouteHandler } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { getDatabase } from "@/lib/database";
import type { Env } from "@/types/env";

import type { checkSlugRoute } from "./check-slug.openapi";

type Handler = RouteHandler<typeof checkSlugRoute, { Bindings: Env }>;

/**
 * GET /api/articles/check-slug - スラッグ重複チェック
 *
 * @description
 * 1. DBクライアントを作成
 * 2. クエリパラメータを取得
 * 3. 指定されたスラッグが既に存在するかチェック
 * 4. 結果を返す
 */
export const checkSlug: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, articles } = await getDatabase();
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. クエリパラメータを取得
		const { slug } = c.req.valid("query");

		// 3. 指定されたスラッグが既に存在するかチェック
		const existingArticle = await db
			.select({ id: articles.id })
			.from(articles)
			.where(eq(articles.slug, slug))
			.limit(1);

		const isAvailable = existingArticle.length === 0;

		// 4. 結果を返す
		return c.json(
			{
				available: isAvailable,
				message: isAvailable ? undefined : "このスラッグは既に使用されています",
			},
			200
		);
	} catch (error) {
		console.error("Error checking slug:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to check slug",
				},
			},
			500
		);
	}
};
