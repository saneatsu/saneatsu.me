import { createRoute, z } from "@hono/zod-openapi";
import { articles, articleTranslations, db } from "@saneatsu/db";
import { and, eq, sql } from "drizzle-orm";
import type { Context } from "hono";
import { extractHeadings } from "../../utils/markdown";

/**
 * サジェストアイテムのスキーマ
 */
export const SuggestionItemSchema = z.object({
	slug: z.string().openapi({
		example: "nextjs-basics",
		description: "記事のスラッグ",
	}),
	title: z.string().openapi({
		example: "Next.jsの基本",
		description: "記事または見出しのタイトル",
	}),
	type: z.enum(["article", "heading"]).openapi({
		example: "article",
		description: "サジェストのタイプ",
	}),
	headingLevel: z.number().int().min(1).max(6).optional().openapi({
		example: 2,
		description: "見出しのレベル（1-6）",
	}),
	headingId: z.string().optional().openapi({
		example: "routing",
		description: "見出しのID（URLアンカー用）",
	}),
	articleTitle: z.string().optional().openapi({
		example: "Next.jsの基本",
		description: "見出しが属する記事のタイトル",
	}),
});

/**
 * サジェスト取得のクエリパラメータスキーマ
 */
export const ArticleSuggestionsQuerySchema = z.object({
	q: z.string().min(1).openapi({
		example: "Next",
		description: "検索クエリ文字列",
	}),
	lang: z.enum(["ja", "en"]).optional().default("ja").openapi({
		example: "ja",
		description: "表示言語",
	}),
	limit: z.string().regex(/^\d+$/).optional().default("20").openapi({
		example: "20",
		description: "取得する最大件数",
	}),
});

/**
 * サジェストレスポンスのスキーマ
 */
export const ArticleSuggestionsResponseSchema = z.object({
	suggestions: z.array(SuggestionItemSchema),
	fromCache: z.boolean().openapi({
		example: false,
		description: "キャッシュから取得したかどうか",
	}),
});

/**
 * エラースキーマ
 */
export const ErrorSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
	}),
});

/**
 * サジェスト取得のルート定義
 */
export const getSuggestionsRoute = createRoute({
	method: "get",
	path: "/suggestions",
	request: {
		query: ArticleSuggestionsQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ArticleSuggestionsResponseSchema,
				},
			},
			description: "サジェストの取得成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "不正なリクエスト",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Articles"],
	summary: "Wiki Linkサジェスト取得",
	description:
		"記事タイトルと見出しのサジェストを取得します。Wiki Link機能（`[[`記法）で使用されます。",
});

/**
 * GET /api/articles/suggestions - Wiki Linkサジェスト取得ハンドラー
 */
// @ts-ignore - Hono Context型の互換性問題を回避
export async function handleArticleSuggestions(c: Context) {
	try {
		const query = c.req.query();
		const q = query.q || "";
		const lang = (query.lang === "en" ? "en" : "ja") as "ja" | "en";
		const limitStr = query.limit || "20";
		const limit = parseInt(limitStr || "20", 10);

		// qが必須パラメータなので、存在チェック
		if (!q) {
			return c.json(
				{
					error: {
						code: "BAD_REQUEST",
						message: "検索クエリが必要です",
					},
				},
				400
			);
		}


		// TODO: Cloudflare KVからキャッシュを取得
		// 現在は常にデータベースから取得

		// 1. 記事タイトルを検索（公開済みのみ）
		const articleResults = await db
			.select({
				slug: articles.slug,
				title: articleTranslations.title,
				content: articleTranslations.content,
			})
			.from(articles)
			.innerJoin(
				articleTranslations,
				and(
					eq(articles.id, articleTranslations.articleId),
					eq(articleTranslations.language, lang)
				)
			)
			.where(
				and(
					eq(articles.status, "published"),
					sql`LOWER(${articleTranslations.title}) LIKE LOWER(${`%${q}%`})`
				)
			)
			.limit(limit);


		const suggestions: Array<z.infer<typeof SuggestionItemSchema>> = [];

		// 2. 記事タイトルをサジェストに追加
		for (const article of articleResults) {
			if (article.title) {
				suggestions.push({
					slug: article.slug,
					title: article.title,
					type: "article",
				});
			}
		}

		// 3. 記事コンテンツから見出しを抽出して検索
		if (suggestions.length < limit) {
			// すべての公開済み記事を取得（パフォーマンスの観点から制限）
			const allArticles = await db
				.select({
					slug: articles.slug,
					title: articleTranslations.title,
					content: articleTranslations.content,
				})
				.from(articles)
				.innerJoin(
					articleTranslations,
					and(
						eq(articles.id, articleTranslations.articleId),
						eq(articleTranslations.language, lang)
					)
				)
				.where(eq(articles.status, "published"))
				.limit(100); // パフォーマンスのため制限

			for (const article of allArticles) {
				if (!article.content || !article.title) continue;

				// 見出しを抽出
				const headings = extractHeadings(article.content, 3);

				// 見出しから検索（大文字小文字を無視）
				for (const heading of headings) {
					if (heading.text.toLowerCase().includes(q.toLowerCase())) {
						suggestions.push({
							slug: article.slug,
							title: heading.text,
							type: "heading",
							headingLevel: heading.level,
							headingId: heading.id,
							articleTitle: article.title,
						});

						if (suggestions.length >= limit) break;
					}
				}

				if (suggestions.length >= limit) break;
			}
		}

		// 4. 結果を制限して返す
		const limitedSuggestions = suggestions.slice(0, limit);

		// TODO: Cloudflare KVにキャッシュを保存

		return c.json({
			suggestions: limitedSuggestions,
			fromCache: false, // 現在は常にfalse
		});
	} catch (error) {
		console.error("Error fetching suggestions:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch suggestions",
				},
			},
			500
		);
	}
}
