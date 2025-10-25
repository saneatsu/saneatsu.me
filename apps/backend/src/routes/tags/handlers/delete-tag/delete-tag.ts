import type { RouteHandler } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";

import type { deleteTagRoute } from "./delete-tag.openapi";

type Handler = RouteHandler<typeof deleteTagRoute, { Bindings: Env }>;

/**
 * DELETE /api/tags/:id - タグ削除
 *
 * @description
 * 1. DBクライアントを作成
 * 2. パラメータからIDを取得
 * 3. IDの検証
 * 4. 既存タグの存在確認
 * 5. タグを削除（articleTagsは自動削除される）
 * 6. レスポンスを返す
 */
export const deleteTag: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, tags } = await getDatabase();
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. パラメータからIDを取得
		const { id } = c.req.valid("param");

		// 3. IDの検証
		const tagId = Number.parseInt(id);
		if (Number.isNaN(tagId)) {
			return c.json(
				{
					error: {
						code: "INVALID_ID",
						message: "Invalid tag ID",
					},
				},
				400
			);
		}

		// 4. 既存タグの存在確認
		const existingTag = await db
			.select({ id: tags.id })
			.from(tags)
			.where(eq(tags.id, tagId))
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

		// 5. タグを削除（articleTagsは自動削除される）
		await db.delete(tags).where(eq(tags.id, tagId));

		// 6. レスポンスを返す
		return c.json(
			{
				message: "タグが正常に削除されました",
			},
			200
		);
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
};
