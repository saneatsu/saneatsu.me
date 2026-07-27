import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq, not } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";
import { translateWithGemini } from "@/lib/translate";
import { createTranslationService } from "@/services/gemini-translation/gemini-translation";

import type { updateTagRoute } from "./update-tag.openapi";

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
 * 8. 英語への翻訳を実行（手動指定または自動翻訳）
 *    - enNameが提供されている場合：手動で指定された英語名を使用
 *    - enNameが未指定の場合：Gemini APIで自動翻訳
 * 9. レスポンスを返す
 */
export const updateTag: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, tags, tagTranslations } = await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. パラメータとリクエストボディを取得
		const { id } = c.req.valid("param");
		const { name, enName, esName, slug } = c.req.valid("json");

		// 3. IDの検証
		const tagId = Number.parseInt(id, 10);
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

		// 8. 英語への翻訳を実行（手動指定または自動翻訳）
		let englishName: string | null = null;

		if (enName) {
			// 手動で提供された英語名を使用
			englishName = enName;
			console.log(`Using manually provided English name for tag ${tagId}`);
		} else if (c.env.GEMINI_API_KEY) {
			// 英語名が提供されていない場合は自動翻訳
			try {
				const translationService = createTranslationService({
					GEMINI_API_KEY: c.env.GEMINI_API_KEY,
				});

				englishName = await translationService.translateTag(name);

				if (englishName) {
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

		// 英語名が取得できた場合のみ更新
		if (englishName) {
			await db
				.update(tagTranslations)
				.set({
					name: englishName,
				})
				.where(
					and(
						eq(tagTranslations.tagId, tagId),
						eq(tagTranslations.language, "en")
					)
				);
		}

		// 8-2. スペイン語への翻訳を実行（手動指定または自動翻訳）
		// enName と同様に、esName があればそれを使い、無ければ Gemini で自動翻訳する。
		let spanishName: string | null = null;

		if (esName) {
			// 手動で提供されたスペイン語名を使用
			spanishName = esName;
		} else if (c.env.GEMINI_API_KEY) {
			// スペイン語名が未指定の場合は自動翻訳（表示名なので自然な訳を得る translateWithGemini を使う）
			try {
				spanishName = await translateWithGemini(
					name,
					c.env.GEMINI_API_KEY,
					"es"
				);
			} catch (error) {
				// 翻訳エラーが発生してもメインの処理は続行
				console.error(`Spanish translation error for tag ${tagId}:`, error);
			}
		}

		// スペイン語名が取得できた場合のみ保存
		// tag_translations には (tagId, language) のユニーク制約が無いため upsert は使えない。
		// 既存の es 行があれば UPDATE、無ければ INSERT する。
		if (spanishName) {
			const existingEs = await db
				.select({ id: tagTranslations.id })
				.from(tagTranslations)
				.where(
					and(
						eq(tagTranslations.tagId, tagId),
						eq(tagTranslations.language, "es")
					)
				)
				.limit(1);

			if (existingEs.length > 0) {
				await db
					.update(tagTranslations)
					.set({ name: spanishName })
					.where(
						and(
							eq(tagTranslations.tagId, tagId),
							eq(tagTranslations.language, "es")
						)
					);
			} else {
				await db.insert(tagTranslations).values({
					tagId,
					language: "es",
					name: spanishName,
				});
			}
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
