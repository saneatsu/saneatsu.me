import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";

import type { updateStatusRoute } from "./update-status.openapi";

type Handler = RouteHandler<typeof updateStatusRoute, { Bindings: Env }>;

/**
 * PATCH /api/articles/:id/status - 記事ステータス更新
 *
 * @description
 * 1. DBクライアントを作成
 * 2. パラメータとリクエストボディを取得
 * 3. 既存記事の存在確認
 * 4. ステータスを更新
 *    - statusがpublishedに変更される場合、publishedAtが未設定なら現在時刻を設定
 *    - statusがdraftまたはarchivedに変更される場合、publishedAtをnullにする
 * 5. 更新後の記事を取得
 * 6. レスポンスを返す
 */
export const updateStatus: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, articles, articleTranslations } =
			await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. パラメータとリクエストボディを取得
		const { id } = c.req.valid("param");
		const { status } = c.req.valid("json");

		const articleId = parseInt(id, 10);
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

		// 3. 既存記事の存在確認
		const existingArticle = await db
			.select({
				id: articles.id,
				status: articles.status,
				publishedAt: articles.publishedAt,
			})
			.from(articles)
			.where(eq(articles.id, articleId))
			.limit(1);

		if (existingArticle.length === 0) {
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

		// 4. ステータスを更新
		const now = new Date().toISOString();
		let finalPublishedAt = existingArticle[0].publishedAt;

		// statusがpublishedに変更される場合、publishedAtが未設定なら現在時刻を設定
		if (status === "published" && !existingArticle[0].publishedAt) {
			finalPublishedAt = now;
		}
		// statusがdraftまたはarchivedに変更される場合、publishedAtをnullにする
		else if (status === "draft" || status === "archived") {
			finalPublishedAt = null;
		}

		await db
			.update(articles)
			.set({
				status,
				publishedAt: finalPublishedAt,
				updatedAt: now,
			})
			.where(eq(articles.id, articleId));

		// 5. 更新後の記事を取得
		const updatedArticle = await db
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
					eq(articleTranslations.language, "ja")
				)
			)
			.where(eq(articles.id, articleId))
			.limit(1);

		// 6. レスポンスを返す
		return c.json(
			{
				data: updatedArticle[0],
				message: "記事ステータスが正常に更新されました",
			},
			200
		);
	} catch (error) {
		console.error("Error updating article status:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to update article status",
				},
			},
			500
		);
	}
};
