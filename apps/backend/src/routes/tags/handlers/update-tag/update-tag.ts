import type { RouteHandler } from "@hono/zod-openapi";
import { tags, tagTranslations } from "@saneatsu/db/worker";
import { and, eq, not } from "drizzle-orm";

import { createTranslationService } from "@/services/gemini-translation";
import type { updateTagRoute } from "./update-tag.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	GEMINI_API_KEY?: string;
};

type Handler = RouteHandler<typeof updateTagRoute, { Bindings: Env }>;

/**
 * PUT /api/tags/:id - タグ更新
 *
 * @description
 * 1. DBクライアントを作成
 * 2. パラメータとリクエストボディを取得
 * 3. IDの検証
 * 4. 既存タグの存在確認
 * 5. スラッグの重複チェック（自分自身は除外）
 * 6. タグデータを更新
 * 7. タグ翻訳データを更新（日本語）
 * 8. 英語への自動翻訳を実行（非同期）
 * 9. レスポンスを返す
 */
export const updateTag: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient } = await import("@saneatsu/db/worker");
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. パラメータとリクエストボディを取得
		const { id } = c.req.valid("param");
		const { name, slug } = c.req.valid("json");

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
			.select({ id: tags.id, slug: tags.slug })
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

		// 5. スラッグの重複チェック（自分自身は除外）
		if (existingTag[0].slug !== slug) {
			const duplicateSlug = await db
				.select({ id: tags.id })
				.from(tags)
				.where(and(eq(tags.slug, slug), not(eq(tags.id, tagId))))
				.limit(1);

			if (duplicateSlug.length > 0) {
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
		}

		// 6. タグデータを更新
		const now = new Date().toISOString();

		const [updatedTag] = await db
			.update(tags)
			.set({
				slug,
				updatedAt: now,
			})
			.where(eq(tags.id, tagId))
			.returning();

		// 7. タグ翻訳データを更新（日本語）
		await db
			.update(tagTranslations)
			.set({
				name,
			})
			.where(
				and(
					eq(tagTranslations.tagId, tagId),
					eq(tagTranslations.language, "ja")
				)
			);

		// 8. 英語への自動翻訳を実行（非同期）
		if (c.env.GEMINI_API_KEY) {
			try {
				const translationService = createTranslationService({
					GEMINI_API_KEY: c.env.GEMINI_API_KEY,
				});

				// タグ名を翻訳
				const translatedName = await translationService.translateTag(name);

				if (translatedName) {
					// 英語版を更新
					await db
						.update(tagTranslations)
						.set({
							name: translatedName,
						})
						.where(
							and(
								eq(tagTranslations.tagId, tagId),
								eq(tagTranslations.language, "en")
							)
						);
					console.log(`Tag ${tagId} translated successfully`);
				} else {
					console.warn(
						`Translation failed for tag ${tagId}, continuing without English translation update`
					);
				}
			} catch (error) {
				// 翻訳エラーが発生してもメインの処理は続行
				console.error(`Translation error for tag ${tagId}:`, error);
			}
		} else {
			console.log("GEMINI_API_KEY not configured, skipping translation");
		}

		// 9. レスポンスを返す
		return c.json(
			{
				data: updatedTag,
				message: "タグが正常に更新されました",
			},
			200
		);
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
};
