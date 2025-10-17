import { createRoute, z } from "@hono/zod-openapi";

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
	q: z.string().openapi({
		example: "Next",
		description: "検索クエリ文字列（空文字列の場合は全記事を取得）",
	}),
	lang: z.enum(["ja", "en"]).optional().default("ja").openapi({
		example: "ja",
		description: "表示言語",
	}),
	limit: z.string().regex(/^\d+$/).optional().default("20").openapi({
		example: "20",
		description: "取得する最大件数",
	}),
	targetSlug: z.string().optional().openapi({
		example: "article-007",
		description: "特定記事の見出しのみを取得したい場合の記事スラッグ",
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
