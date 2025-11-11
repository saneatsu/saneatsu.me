import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq, inArray, not } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";
import { extractGalleryCfImageIds } from "@/lib/extract-gallery-cf-image-ids";
import {
	buildContributionText,
	recordArticleContribution,
} from "@/lib/record-article-contribution";
import { createTranslationService } from "@/services/gemini-translation/gemini-translation";

import type { updateArticleRoute } from "./update-article.openapi";

type Handler = RouteHandler<typeof updateArticleRoute, { Bindings: Env }>;

/**
 * PUT /api/articles/:id - 記事更新
 *
 * @description
 * 1. DBクライアントを作成
 * 2. パラメータとリクエストボディを取得
 * 3. 既存記事の存在確認
 * 4. スラッグの重複チェック（自分自身は除外）
 * 5. 記事データを更新
 * 6. 翻訳データを更新（日本語）
 * 7. 英語への自動翻訳を実行
 * 8. タグとの関連付けを更新
 * 8.1. ギャラリー画像との紐付けを更新
 * 9. レスポンス用のデータを取得
 * 10. レスポンスを返す
 */
export const updateArticle: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const {
			createDatabaseClient,
			articles,
			articleGalleryImages,
			articleTags,
			articleTranslations,
			galleryImages,
		} = await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. パラメータとリクエストボディを取得
		const { id } = c.req.valid("param");
		const {
			title,
			slug,
			content,
			status,
			publishedAt,
			tagIds,
			galleryImageIds,
		} = c.req.valid("json");

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
			.select({ id: articles.id, slug: articles.slug })
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

		// 4. スラッグの重複チェック（自分自身は除外）
		if (existingArticle[0].slug !== slug) {
			const duplicateSlug = await db
				.select({ id: articles.id })
				.from(articles)
				.where(and(eq(articles.slug, slug), not(eq(articles.id, articleId))))
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

		// 5. 記事データを更新
		const now = new Date().toISOString();
		const finalPublishedAt = status === "published" ? publishedAt || now : null;

		await db
			.update(articles)
			.set({
				slug,
				status,
				publishedAt: finalPublishedAt,
				updatedAt: now,
			})
			.where(eq(articles.id, articleId));

		const existingJaTranslation = await db
			.selectDistinct({
				title: articleTranslations.title,
				content: articleTranslations.content,
			})
			.from(articleTranslations)
			.where(
				and(
					eq(articleTranslations.articleId, articleId),
					eq(articleTranslations.language, "ja")
				)
			)
			.limit(1);
		const previousContributionText = buildContributionText({
			title: existingJaTranslation[0]?.title ?? null,
			content: existingJaTranslation[0]?.content ?? null,
		});
		const nextContributionText = buildContributionText({ title, content });

		// 6. 翻訳データをUpsert（日本語）
		// レコードがない場合は新規作成、ある場合は更新
		await db
			.insert(articleTranslations)
			.values({
				articleId,
				language: "ja",
				title,
				content,
			})
			.onConflictDoUpdate({
				target: [articleTranslations.articleId, articleTranslations.language],
				set: {
					title,
					content,
				},
			});
		if (nextContributionText) {
			await recordArticleContribution({
				db,
				previousText: previousContributionText,
				nextText: nextContributionText,
				eventDate: new Date(now),
			});
		}

		// 7. 英語への自動翻訳を実行（公開記事の場合のみ）
		const warnings: Array<{ code: string; message: string }> = [];

		if (status === "published") {
			try {
				const translationService = createTranslationService({
					GEMINI_API_KEY: c.env.GEMINI_API_KEY,
				});

				// 記事を翻訳
				const translatedArticle = await translationService.translateArticle(
					title,
					content
				);

				if (translatedArticle) {
					// 英語版をUpsert
					// レコードがない場合は新規作成、ある場合は更新
					await db
						.insert(articleTranslations)
						.values({
							articleId,
							language: "en",
							title: translatedArticle.title,
							content: translatedArticle.content,
						})
						.onConflictDoUpdate({
							target: [
								articleTranslations.articleId,
								articleTranslations.language,
							],
							set: {
								title: translatedArticle.title,
								content: translatedArticle.content,
							},
						});
				} else {
					warnings.push({
						code: "TRANSLATION_FAILED",
						message:
							"英語への自動翻訳に失敗しました。記事の更新は正常に完了しています。",
					});
				}
			} catch (error) {
				// 翻訳エラーが発生してもメインの処理は続行
				console.error(`Translation error for article ${articleId}:`, error);
				const errorMessage =
					error instanceof Error
						? error.message
						: "英語への自動翻訳中にエラーが発生しました";
				warnings.push({
					code: "TRANSLATION_FAILED",
					message: `${errorMessage}。記事の更新は正常に完了しています。`,
				});
			}
		} else if (status === "draft") {
			console.log(`Article ${articleId} is a draft, skipping translation`);
		}

		// 8. タグとの関連付けを更新
		// 既存のタグ関連を削除
		await db.delete(articleTags).where(eq(articleTags.articleId, articleId));

		// 新しいタグ関連を作成
		if (tagIds && tagIds.length > 0) {
			await db.insert(articleTags).values(
				tagIds.map((tagId) => ({
					articleId,
					tagId,
				}))
			);
		}

		// 8.1. ギャラリー画像との紐付けを更新
		// 8.1.1. コンテンツからギャラリー画像を自動抽出
		const extractedCfImageIds = extractGalleryCfImageIds(content);

		// 8.1.2. cfImageIdからgallery_images.idを取得
		const extractedGalleryImageIds: number[] = [];
		if (extractedCfImageIds.length > 0) {
			const galleryRecords = await db
				.select({ id: galleryImages.id })
				.from(galleryImages)
				.where(inArray(galleryImages.cfImageId, extractedCfImageIds));

			extractedGalleryImageIds.push(...galleryRecords.map((r) => r.id));
		}

		// 8.1.3. 手動指定のIDと自動抽出のIDをマージ（重複除去）
		const allGalleryImageIds = Array.from(
			new Set([...(galleryImageIds || []), ...extractedGalleryImageIds])
		);

		// 8.1.4. 既存のギャラリー画像の紐付けを削除
		await db
			.delete(articleGalleryImages)
			.where(eq(articleGalleryImages.articleId, articleId));

		// 8.1.5. 新しいギャラリー画像の紐付けを作成
		if (allGalleryImageIds.length > 0) {
			await db.insert(articleGalleryImages).values(
				allGalleryImageIds.map((galleryImageId) => ({
					articleId,
					galleryImageId,
				}))
			);
		}

		// 9. レスポンス用のデータを取得
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

		// 10. レスポンスを返す
		return c.json(
			{
				data: updatedArticle[0],
				message: "記事が正常に更新されました",
				...(warnings.length > 0 && { warnings }),
			},
			200
		);
	} catch (error) {
		console.error("Error updating article:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to update article",
				},
			},
			500
		);
	}
};
