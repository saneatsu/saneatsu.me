import type { RouteHandler } from "@hono/zod-openapi";
import { tags } from "@saneatsu/db/worker";
import { eq } from "drizzle-orm";

import type { createTagRoute } from "./create-tag.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
};

type Handler = RouteHandler<typeof createTagRoute, { Bindings: Env }>;

/**
 * POST /api/tags - タグ作成
 *
 * @description
 * 1. DBクライアントを作成
 * 2. リクエストボディを取得
 * 3. スラッグの重複チェック
 * 4. タグデータを作成
 * 5. レスポンスを返す
 */
export const createTag: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. リクエストボディを取得
		const { slug } = c.req.valid("json");

		// 3. スラッグの重複チェック
		const existingTag = await db
			.select({ id: tags.id })
			.from(tags)
			.where(eq(tags.slug, slug))
			.limit(1);

		if (existingTag.length > 0) {
			return c.json(
				{
					error: {
						code: "SLUG_ALREADY_EXISTS",
						message: "このスラッグは既に使用されています",
					},
				},
				409
			);
		}

		// 4. タグデータを作成
		const now = new Date().toISOString();

		const [newTag] = await db
			.insert(tags)
			.values({
				slug,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		// 5. レスポンスを返す
		return c.json(
			{
				data: newTag,
				message: "タグが正常に作成されました",
			},
			201
		);
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
};
