import type { RouteHandler } from "@hono/zod-openapi";
import { like } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";

import type { getTagSuggestionsRoute } from "./get-tag-suggestions.openapi";

type Handler = RouteHandler<typeof getTagSuggestionsRoute, { Bindings: Env }>;

/**
 * GET /api/tags/suggestions - タグサジェスト取得
 *
 * @description
 * 1. クエリパラメータから検索文字列を取得
 * 2. データベースからマッチするタグを検索
 * 3. 最大10件のサジェストを返す
 */
export const getTagSuggestions: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, tags } = await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. クエリパラメータから検索文字列を取得
		const query = c.req.query("q") || "";

		// 3. タグを検索
		let tagList: { id: number | null; slug: string }[];

		if (!query.trim()) {
			// 空のクエリの場合は、全てのタグを返す
			tagList = await db
				.select({
					id: tags.id,
					slug: tags.slug,
				})
				.from(tags)
				.limit(10);
		} else {
			// クエリにマッチするタグを検索
			tagList = await db
				.select({
					id: tags.id,
					slug: tags.slug,
				})
				.from(tags)
				.where(like(tags.slug, `%${query}%`))
				.limit(10);
		}

		// 4. レスポンスを返す
		return c.json(
			{
				suggestions: tagList.map((tag) => ({
					id: tag.id ?? 0,
					slug: tag.slug,
					name: tag.slug,
					type: "tag" as const,
				})),
			},
			200
		);
	} catch (error) {
		console.error("Error fetching tag suggestions:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch tag suggestions",
				},
			},
			500
		);
	}
};
