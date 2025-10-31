import { createRoute, z } from "@hono/zod-openapi";

/**
 * タグスキーマ
 */
const TagSchema = z.object({
	id: z.number().int().openapi({
		example: 1,
		description: "タグのユニークID",
	}),
	slug: z.string().openapi({
		example: "typescript",
		description: "タグのスラッグ（日本語名）",
	}),
	createdAt: z.string().openapi({
		example: "2024-01-01T00:00:00.000Z",
		description: "作成日時",
	}),
	updatedAt: z.string().openapi({
		example: "2024-01-02T00:00:00.000Z",
		description: "更新日時",
	}),
	articleCount: z.number().int().openapi({
		example: 5,
		description: "このタグが付けられた記事の数",
	}),
	translations: z
		.object({
			ja: z.string().nullable().openapi({
				example: "タイプスクリプト",
				description: "日本語の翻訳",
			}),
			en: z.string().nullable().openapi({
				example: "TypeScript",
				description: "英語の翻訳",
			}),
		})
		.openapi({
			description: "タグの翻訳データ",
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
			example: "Failed to fetch tags",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * タグ一覧レスポンススキーマ
 */
const TagsResponseSchema = z.object({
	data: z.array(TagSchema),
});

/**
 * OpenAPI用クエリパラメータスキーマ
 */
const tagsQuerySchema = z.object({
	status: z.enum(["published", "draft", "archived"]).optional().openapi({
		example: "published",
		description:
			"記事のステータスでフィルタリング（指定なしの場合は全ステータス）",
	}),
});

/**
 * タグ一覧取得のルート定義
 */
export const getAllTagsRoute = createRoute({
	method: "get",
	path: "/",
	request: {
		query: tagsQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TagsResponseSchema,
				},
			},
			description: "タグ一覧の取得成功",
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
	summary: "タグ一覧取得",
	description: "すべてのタグ一覧を取得します。各タグには記事数が含まれます。",
});
