import { z } from "@hono/zod-openapi";

/**
 * エラーレスポンスのスキーマ
 */
export const ErrorSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
	}),
});

/**
 * ページネーション情報のスキーマ
 */
export const PaginationSchema = z.object({
	total: z.number().int(),
	page: z.number().int(),
	pageSize: z.number().int(),
	totalPages: z.number().int(),
});

/**
 * 記事スキーマ（タグで使用）
 */
export const ArticleSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string().nullable(),
	description: z.string().nullable(),
	content: z.string().nullable(),
	viewCount: z.number().int().nullable(),
	cfImageId: z.string().nullable(),
	status: z.enum(["draft", "published", "archived"]),
	publishedAt: z.string().nullable(),
	language: z.enum(["ja", "en"]).nullable(),
	tags: z.array(z.any()).optional(),
});

/**
 * タグオブジェクトのスキーマ
 */
export const TagSchema = z.object({
	id: z.number().int().openapi({
		example: 1,
		description: "タグのユニークID",
	}),
	slug: z.string().openapi({
		example: "javascript",
		description: "タグのスラッグ",
	}),
	name: z.string().nullable().openapi({
		example: "JavaScript",
		description: "タグ名",
	}),
	articleCount: z.number().int().min(0).openapi({
		example: 10,
		description: "このタグが付けられた記事数",
	}),
});

/**
 * タグ一覧取得のクエリパラメータスキーマ
 */
export const TagsQuerySchema = z.object({
	lang: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
		description: "言語",
	}),
});

/**
 * タグ一覧レスポンスのスキーマ
 */
export const TagsResponseSchema = z.object({
	data: z.array(TagSchema),
});

/**
 * タグ別記事一覧取得のパラメータスキーマ
 */
export const TagArticlesParamSchema = z.object({
	slug: z.string().openapi({
		example: "javascript",
		description: "タグのスラッグ",
	}),
});

/**
 * タグ別記事一覧取得のクエリパラメータスキーマ
 */
export const TagArticlesQuerySchema = z.object({
	page: z.string().optional().openapi({
		example: "1",
		description: "ページ番号",
	}),
	limit: z.string().optional().openapi({
		example: "10",
		description: "1ページあたりの記事数",
	}),
	lang: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
		description: "言語",
	}),
});

/**
 * タグ別記事一覧レスポンスのスキーマ
 */
export const TagArticlesResponseSchema = z.object({
	data: z.array(ArticleSchema),
	pagination: PaginationSchema,
});

/**
 * タグ詳細（翻訳含む）のスキーマ
 */
export const TagDetailSchema = z
	.object({
		id: z.number().int(),
		slug: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
		translations: z.array(
			z.object({
				id: z.number().int(),
				name: z.string(),
				language: z.enum(["ja", "en"]),
				tagId: z.number().int(),
			})
		),
	})
	.openapi({
		example: {
			id: 1,
			slug: "javascript",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
			translations: [
				{
					id: 1,
					name: "JavaScript",
					language: "ja",
					tagId: 1,
				},
				{
					id: 2,
					name: "JavaScript",
					language: "en",
					tagId: 1,
				},
			],
		},
	});

/**
 * タグ作成リクエストのスキーマ
 */
export const CreateTagRequestSchema = z
	.object({
		slug: z.string().regex(/^[a-z0-9-]+$/),
		translations: z
			.array(
				z.object({
					name: z.string().min(1).max(50),
					language: z.enum(["ja", "en"]),
				})
			)
			.min(2)
			.max(2),
	})
	.openapi({
		example: {
			slug: "javascript",
			translations: [
				{
					name: "JavaScript",
					language: "ja",
				},
				{
					name: "JavaScript",
					language: "en",
				},
			],
		},
	});

/**
 * タグ更新リクエストのスキーマ
 */
export const UpdateTagRequestSchema = z
	.object({
		slug: z
			.string()
			.regex(/^[a-z0-9-]+$/)
			.optional(),
		translations: z
			.array(
				z.object({
					id: z.number().int().optional(),
					name: z.string().min(1).max(50).optional(),
					language: z.enum(["ja", "en"]),
				})
			)
			.min(2)
			.max(2)
			.optional(),
	})
	.openapi({
		example: {
			slug: "javascript",
			translations: [
				{
					name: "JavaScript",
					language: "ja",
				},
				{
					name: "JavaScript",
					language: "en",
				},
			],
		},
	});

/**
 * タグ個別取得のパラメータスキーマ
 */
export const TagIdParamSchema = z.object({
	id: z.string().regex(/^\d+$/).openapi({
		example: "1",
		description: "タグのID",
	}),
});

/**
 * タグ詳細レスポンスのスキーマ
 */
export const TagDetailResponseSchema = z.object({
	data: TagDetailSchema,
});

