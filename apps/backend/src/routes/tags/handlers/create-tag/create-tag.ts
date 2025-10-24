import type { RouteHandler } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { getDatabase } from "@/lib/database";
import { createTranslationService } from "@/services/gemini-translation/gemini-translation";
import type { Env } from "@/types/env";

import type { createTagRoute } from "./create-tag.openapi";

type Handler = RouteHandler<typeof createTagRoute, { Bindings: Env }>;

/**
 * POST /api/tags - タグ作成
 *
 * @description
 * 1. DBクライアントを作成
 * 2. リクエストボディを取得
 * 3. スラッグの重複チェック
 * 4. タグデータを作成
 * 5. タグ翻訳データを作成（日本語）
 * 6. 英語への自動翻訳を実行（非同期）
 * 7. レスポンスを返す
 */
export const createTag: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, tags, tagTranslations } = await getDatabase();
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. リクエストボディを取得
		const { name, slug } = c.req.valid("json");

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

		// 5. タグ翻訳データを作成（日本語）
		await db.insert(tagTranslations).values({
			tagId: newTag.id,
			language: "ja",
			name,
		});

		// 6. 英語への自動翻訳を実行（非同期）
		if (c.env.GEMINI_API_KEY) {
			try {
				const translationService = createTranslationService({
					GEMINI_API_KEY: c.env.GEMINI_API_KEY,
				});

				// タグ名を翻訳
				const translatedName = await translationService.translateTag(name);

				if (translatedName) {
					// 英語版を保存
					await db.insert(tagTranslations).values({
						tagId: newTag.id,
						language: "en",
						name: translatedName,
					});
					console.log(`Tag ${newTag.id} translated successfully`);
				} else {
					console.warn(
						`Translation failed for tag ${newTag.id}, continuing without English translation`
					);
				}
			} catch (error) {
				// 翻訳エラーが発生してもメインの処理は続行
				console.error(`Translation error for tag ${newTag.id}:`, error);
			}
		} else {
			console.log("GEMINI_API_KEY not configured, skipping translation");
		}

		// 7. レスポンスを返す
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
