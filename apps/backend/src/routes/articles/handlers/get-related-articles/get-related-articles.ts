import type { RouteHandler } from "@hono/zod-openapi";
import { and, desc, eq, inArray, ne, notInArray } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";

import type { getRelatedArticlesRoute } from "./get-related-articles.openapi";

type Handler = RouteHandler<typeof getRelatedArticlesRoute, { Bindings: Env }>;

/**
 * GET /api/articles/:slug/related - 関連記事取得
 *
 * @description
 * 1. DBクライアントを作成
 * 2. パラメータを取得・検証
 * 3. 現在の記事を取得（スラッグから）
 *    3.1. 記事が見つからない場合は404
 *    3.2. 公開済み以外は404
 * 4. 現在の記事のタグIDを抽出
 * 5. タグマッチする記事を取得（多めに取得してアプリ側でソート）
 *    5.1. 同じタグを持つ記事を取得（現在の記事を除外、公開済みのみ）
 *    5.2. タグ情報も一緒に取得
 * 6. タグマッチ数でソートして絞り込み
 * 7. limit未満の場合は最新記事で補完
 * 8. レスポンスを返す
 */
export const getRelatedArticles: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const {
			createDatabaseClient,
			articles,
			articleTags,
			articleTranslations,
			tagTranslations,
			tags,
		} = await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. パラメータを取得・検証
		const { slug } = c.req.valid("param");
		const { language: lang = "ja", limit: limitParam = "6" } =
			c.req.valid("query");
		const limit = Number(limitParam);

		// 3. 現在の記事を取得（スラッグから）
		const currentArticle = await db
			.select({
				id: articles.id,
				status: articles.status,
			})
			.from(articles)
			.where(eq(articles.slug, slug))
			.limit(1);

		// 3.1. 記事が見つからない場合は404
		if (currentArticle.length === 0) {
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

		const currentArticleData = currentArticle[0];

		// 3.2. 公開済み以外は404
		if (currentArticleData.status !== "published") {
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

		// 4. 現在の記事のタグIDを抽出
		const currentArticleTagIds = await db
			.select({ tagId: articleTags.tagId })
			.from(articleTags)
			.where(eq(articleTags.articleId, currentArticleData.id));

		const tagIds = currentArticleTagIds.map((t) => t.tagId);

		let relatedArticles: Array<{
			id: number;
			slug: string;
			cfImageId: string | null;
			status: string;
			publishedAt: string | null;
			updatedAt: string;
			title: string | null;
			content: string | null;
			viewCount: number;
			tags: Array<{
				id: number;
				slug: string;
				createdAt: string;
				updatedAt: string;
				articleCount: number;
				translations: { ja: string; en: string };
			}>;
		}> = [];

		// 5. タグマッチする記事を取得
		if (tagIds.length > 0) {
			// 5.1. 同じタグを持つ記事を取得（多めに取得してアプリ側でソート）
			const articlesWithMatchingTags = await db
				.selectDistinct({
					articleId: articleTags.articleId,
				})
				.from(articleTags)
				.where(inArray(articleTags.tagId, tagIds));

			const matchingArticleIds = articlesWithMatchingTags.map(
				(a) => a.articleId
			);

			if (matchingArticleIds.length > 0) {
				// 記事の詳細を取得
				const matchingArticles = await db
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
							eq(articleTranslations.language, lang)
						)
					)
					.where(
						and(
							inArray(articles.id, matchingArticleIds),
							ne(articles.id, currentArticleData.id),
							eq(articles.status, "published")
						)
					)
					.orderBy(desc(articles.updatedAt))
					.limit(limit * 2); // 多めに取得

				// 5.2. タグ情報を取得
				const articleIds = matchingArticles.map((article) => article.id);
				let articleTagsData: Array<{
					articleId: number;
					tagId: number;
					tagSlug: string;
					tagCreatedAt: string;
					tagUpdatedAt: string;
					tagName: string;
					tagLanguage: string;
				}> = [];

				if (articleIds.length > 0) {
					articleTagsData = await db
						.select({
							articleId: articleTags.articleId,
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
						.where(inArray(articleTags.articleId, articleIds));
				}

				// 6. タグマッチ数でソートして絞り込み
				const articlesWithTagsAndMatchCount = matchingArticles.map(
					(article) => {
						// この記事のタグデータを取得
						const articleTagsForArticle = articleTagsData.filter(
							(tag) => tag.articleId === article.id
						);

						// タグIDごとにグループ化して翻訳情報をまとめる
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

						for (const tagData of articleTagsForArticle) {
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

						const articleTagIds = Array.from(tagsMap.keys());
						// タグマッチ数をカウント
						const matchCount = articleTagIds.filter((id) =>
							tagIds.includes(id)
						).length;

						return {
							...article,
							tags: Array.from(tagsMap.values()),
							matchCount,
						};
					}
				);

				// タグマッチ数で降順ソート、次にupdatedAtで降順ソート
				articlesWithTagsAndMatchCount.sort((a, b) => {
					if (a.matchCount !== b.matchCount) {
						return b.matchCount - a.matchCount;
					}
					return (
						new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
					);
				});

				// limit数まで絞る
				relatedArticles = articlesWithTagsAndMatchCount
					.slice(0, limit)
					.map((article) => {
						// matchCountを削除
						const { matchCount: _matchCount, ...rest } = article;
						return rest;
					});
			}
		}

		// 7. limit未満の場合は最新記事で補完
		if (relatedArticles.length < limit) {
			const remainingLimit = limit - relatedArticles.length;
			const relatedArticleIds = relatedArticles.map((a) => a.id);

			// 既に含まれている記事と現在の記事を除外する条件を作成
			const excludeIds = [currentArticleData.id, ...relatedArticleIds];

			const latestArticles = await db
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
						eq(articleTranslations.language, lang)
					)
				)
				.where(
					and(
						notInArray(articles.id, excludeIds),
						eq(articles.status, "published")
					)
				)
				.orderBy(desc(articles.updatedAt))
				.limit(remainingLimit);

			// タグ情報を取得
			const latestArticleIds = latestArticles.map((article) => article.id);
			let latestArticleTagsData: Array<{
				articleId: number;
				tagId: number;
				tagSlug: string;
				tagCreatedAt: string;
				tagUpdatedAt: string;
				tagName: string;
				tagLanguage: string;
			}> = [];

			if (latestArticleIds.length > 0) {
				latestArticleTagsData = await db
					.select({
						articleId: articleTags.articleId,
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
					.where(inArray(articleTags.articleId, latestArticleIds));
			}

			// タグ情報をグループ化
			const latestArticlesWithTags = latestArticles.map((article) => {
				const articleTagsForArticle = latestArticleTagsData.filter(
					(tag) => tag.articleId === article.id
				);

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

				for (const tagData of articleTagsForArticle) {
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

				return {
					...article,
					tags: Array.from(tagsMap.values()),
				};
			});

			// 関連記事に追加
			relatedArticles = [...relatedArticles, ...latestArticlesWithTags];
		}

		// 8. レスポンスを返す
		return c.json(
			{
				data: relatedArticles,
			},
			200
		);
	} catch (error) {
		console.error("Error fetching related articles:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch related articles",
				},
			},
			500
		);
	}
};
