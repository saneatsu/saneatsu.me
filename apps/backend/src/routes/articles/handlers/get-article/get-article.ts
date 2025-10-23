import type { RouteHandler } from "@hono/zod-openapi";
import { and, eq, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/database";
import { convertWikiLinks } from "@/utils/wiki-link/wiki-link";

import type { getArticleRoute } from "./get-article.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	GEMINI_API_KEY?: string;
};

type Handler = RouteHandler<typeof getArticleRoute, { Bindings: Env }>;

/**
 * GET /api/articles/:slug - 記事詳細取得
 *
 * @description
 * 1. DBクライアントを作成
 * 2. パラメータを取得
 * 3. 記事詳細を取得
 * 4. 記事が見つからない場合は404
 * 5. 公開済み以外は404
 * 6. ログイン中のユーザーかチェック（X-User-Emailヘッダー）
 * 7. 閲覧数をインクリメント（未ログインの場合のみ）
 * 8. タグ情報を取得
 * 9. Wiki Linkをコンテンツ内で変換
 * 10. レスポンスを返す
 */
export const getArticle: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const {
			createDatabaseClient,
			articles,
			articleTags,
			articleTranslations,
			dailyArticleViews,
			tagTranslations,
			tags,
		} = await getDatabase();
		const db = createDatabaseClient({
			TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
		});

		// 2. パラメータを取得
		const { slug } = c.req.valid("param");
		const { lang = "ja" } = c.req.valid("query");

		// 3. 記事詳細を取得
		const article = await db
			.select({
				id: articles.id,
				slug: articles.slug,
				cfImageId: articles.cfImageId,
				status: articles.status,
				publishedAt: articles.publishedAt,
				updatedAt: articles.updatedAt,
				title: articleTranslations.title,
				content: articleTranslations.content,
				viewCount: sql<number>`COALESCE(${articleTranslations.viewCount}, 0)`,
				translationId: articleTranslations.id,
			})
			.from(articles)
			.leftJoin(
				articleTranslations,
				and(
					eq(articles.id, articleTranslations.articleId),
					eq(articleTranslations.language, lang)
				)
			)
			.where(eq(articles.slug, slug))
			.limit(1);

		// 4. 記事が見つからない場合は404
		if (article.length === 0) {
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

		const articleData = article[0];

		// 5. 公開済み以外は404
		if (articleData.status !== "published") {
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

		// 6. ログイン中のユーザーかチェック
		const userEmail = c.req.header("X-User-Email");
		const isLoggedIn = !!userEmail; // ヘッダーがあればログイン中

		// 7. 閲覧数をインクリメント（未ログインの場合のみ）
		if (articleData.translationId && !isLoggedIn) {
			const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

			// 日別閲覧数テーブルに記録（UPSERT）
			await db
				.insert(dailyArticleViews)
				.values({
					date: today,
					viewCount: 1,
				})
				.onConflictDoUpdate({
					target: dailyArticleViews.date,
					set: {
						viewCount: sql`${dailyArticleViews.viewCount} + 1`,
					},
				});

			// 既存の総閲覧数も更新（互換性のため維持）
			await db
				.update(articleTranslations)
				.set({
					viewCount: sql`${articleTranslations.viewCount} + 1`,
				})
				.where(eq(articleTranslations.id, articleData.translationId));

			// レスポンス用に更新後の値を設定
			articleData.viewCount = (articleData.viewCount || 0) + 1;
		}

		// 8. タグ情報を取得
		const articleTagsData = await db
			.select({
				tagId: tags.id,
				tagSlug: tags.slug,
				tagCreatedAt: tags.createdAt,
				tagUpdatedAt: tags.updatedAt,
				tagName: tagTranslations.name,
				tagLanguage: tagTranslations.language,
			})
			.from(articleTags)
			.innerJoin(tags, eq(articleTags.tagId, tags.id))
			.innerJoin(tagTranslations, eq(tags.id, tagTranslations.tagId))
			.where(eq(articleTags.articleId, articleData.id));

		// 9. Wiki Linkをコンテンツ内で変換
		const convertedContent = articleData.content
			? await convertWikiLinks(db, articleData.content, lang)
			: articleData.content;

		// 10. タグの翻訳情報をグループ化
		const tagsMap = new Map<
			number,
			{
				id: number;
				slug: string;
				createdAt: string;
				updatedAt: string;
				articleCount: number;
				translations: { ja: string; en: string };
			}
		>();

		for (const tagData of articleTagsData) {
			if (!tagsMap.has(tagData.tagId)) {
				tagsMap.set(tagData.tagId, {
					id: tagData.tagId,
					slug: tagData.tagSlug,
					createdAt: tagData.tagCreatedAt,
					updatedAt: tagData.tagUpdatedAt,
					articleCount: 0,
					translations: { ja: "", en: "" },
				});
			}

			const tag = tagsMap.get(tagData.tagId);
			if (!tag) continue;
			if (tagData.tagLanguage === "ja") {
				tag.translations.ja = tagData.tagName;
			} else if (tagData.tagLanguage === "en") {
				tag.translations.en = tagData.tagName;
			}
		}

		// 11. レスポンスを返す
		return c.json(
			{
				data: {
					id: articleData.id,
					slug: articleData.slug,
					cfImageId: articleData.cfImageId,
					status: articleData.status,
					publishedAt: articleData.publishedAt,
					updatedAt: articleData.updatedAt,
					title: articleData.title,
					content: convertedContent,
					viewCount: articleData.viewCount,
					tags: Array.from(tagsMap.values()),
				},
			},
			200
		);
	} catch (error) {
		console.error("Error fetching article:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch article",
				},
			},
			500
		);
	}
};
