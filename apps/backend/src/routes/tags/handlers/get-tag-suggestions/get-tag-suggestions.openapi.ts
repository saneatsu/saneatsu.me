import { createRoute, z } from "@hono/zod-openapi";

/**
 * タグサジェストスキーマ
 */
const TagSuggestionSchema = z.object({
	id: z.number().int().openapi({
		example: 1,
		description: "タグのユニークID",
	}),
	slug: z.string().openapi({
		example: "typescript",
		description: "タグのスラッグ",
	}),
	name: z.string().openapi({
		example: "typescript",
		description: "タグの名前",
	}),
	type: z.literal("tag").openapi({
		example: "tag",
		description: "サジェストのタイプ",
	}),
});

/**
 * エラースキーマ
 */
const ErrorSchema = z.object({
	error: z.object({
		code: z.string().openapi({
			example: "DATABASE_ERROR",
			description: "エラーコード",
		}),
		message: z.string().openapi({
			example: "Failed to fetch tag suggestions",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * タグサジェストレスポンススキーマ
 */
const TagSuggestionsResponseSchema = z.object({
	suggestions: z.array(TagSuggestionSchema),
});

/**
 * タグサジェスト取得のルート定義
 */
export const getTagSuggestionsRoute = createRoute({
	method: "get",
	path: "/suggestions",
	request: {
		query: z.object({
			q: z.string().optional().openapi({
				example: "type",
				description: "検索クエリ（省略可能）",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TagSuggestionsResponseSchema,
				},
			},
			description: "タグサジェストの取得成功",
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
	tags: ["Tags"],
	summary: "タグサジェスト取得",
	description:
		"検索クエリに基づいてタグのサジェストを取得します。クエリが空の場合は全タグから最大10件を返します。",
});
