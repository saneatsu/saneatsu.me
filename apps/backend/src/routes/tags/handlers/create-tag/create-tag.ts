import type { RouteHandler } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";
import { translateWithGemini } from "@/lib/translate";
import {
	TARGET_LANGUAGE_NAMES,
	TARGET_LANGUAGES,
} from "@/services/gemini-translation/gemini-translation";

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
 * 6. 対応言語すべてへの自動翻訳を実行
 *    - GEMINI_API_KEY が未設定の場合はスキップし、日本語のみで作成する
 *    - 言語ごとに try/catch するため、1言語が失敗しても他の言語は保存される
 * 7. レスポンスを返す
 */
export const createTag: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, tags, tagTranslations } = await getDatabase();
		const db = createDatabaseClient(c.env);

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

		// 6. 対応言語すべてへの自動翻訳を実行
		// 翻訳先は TARGET_LANGUAGES を単一のソースとするため、言語を増やしても
		// ここは無改修で済む。表示ラベル用途なので、スラッグ生成向けの translateTag
		// ではなく自然な訳語を返す translateWithGemini を使う
		// （バックフィルスクリプトおよびタグ更新と同じ扱い）。
		if (c.env.GEMINI_API_KEY) {
			for (const target of TARGET_LANGUAGES) {
				try {
					const translatedName = await translateWithGemini(
						name,
						c.env.GEMINI_API_KEY,
						target
					);

					// 空の訳語で翻訳行を作ると各言語で空ラベルが表示されてしまうため保存しない
					if (!translatedName) {
						console.warn(
							`Translation for tag ${newTag.id} (${TARGET_LANGUAGE_NAMES[target]}) was empty, skipping`
						);
						continue;
					}

					await db.insert(tagTranslations).values({
						tagId: newTag.id,
						language: target,
						name: translatedName,
					});
					console.log(`Tag ${newTag.id} translated to ${target} successfully`);
				} catch (error) {
					// 1言語の失敗で他言語やタグ作成自体を巻き込まないよう、言語ごとに握りつぶす
					console.error(
						`Translation error for tag ${newTag.id} (${TARGET_LANGUAGE_NAMES[target]}):`,
						error
					);
				}
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
