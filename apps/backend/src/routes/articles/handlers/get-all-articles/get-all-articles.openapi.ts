import { createRoute, z } from "@hono/zod-openapi";

/**
 * OpenAPI用クエリパラメータスキーマ
 */
const articlesOpenApiQuerySchema = z.object({
	page: z.string().optional().openapi({
		example: "1",
		description: "ページ番号",
	}),
	limit: z.string().optional().openapi({
		example: "10",
		description: "1ページあたりの記事数",
	}),
	language: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
		description: "言語",
	}),
	status: z.enum(["published", "draft", "archived"]).optional().openapi({
		example: "published",
		description: "記事のステータス",
	}),
	search: z.string().optional().openapi({
		example: "検索キーワード",
		description: "タイトル検索",
	}),
	sortBy: z
		.enum(["createdAt", "updatedAt", "publishedAt", "title", "viewCount"])
		.optional()
		.openapi({
			example: "createdAt",
			description: "ソートカラム",
		}),
	sortOrder: z.enum(["asc", "desc"]).optional().openapi({
		example: "desc",
		description: "ソート順",
	}),
});

/**
 * タグスキーマ
 */
const TagSchema = z.object({
	id: z.number().int().openapi({
		example: 1,
		description: "タグID",
	}),
	slug: z.string().openapi({
		example: "typescript",
		description: "タグスラッグ",
	}),
	createdAt: z.string().openapi({
		example: "2024-01-01T00:00:00.000Z",
		description: "作成日時",
	}),
	updatedAt: z.string().openapi({
		example: "2024-01-01T00:00:00.000Z",
		description: "更新日時",
	}),
	articleCount: z.number().int().openapi({
		example: 0,
		description: "このタグが付けられた記事の数",
	}),
	translations: z.object({
		ja: z.string().openapi({
			example: "TypeScript",
			description: "日本語のタグ名",
		}),
		en: z.string().openapi({
			example: "TypeScript",
			description: "英語のタグ名",
		}),
	}),
});

/**
 * 記事スキーマ
 */
const ArticleSchema = z.object({
	id: z.number().int().openapi({
		example: 1,
		description: "記事のユニークID",
	}),
	slug: z.string().openapi({
		example: "my-first-blog-post",
		description: "記事のスラッグ",
	}),
	cfImageId: z.string().nullable().openapi({
		example: "image-id-5678",
		description: "Cloudflare画像ID",
	}),
	status: z.string().openapi({
		example: "published",
		description: "記事のステータス",
	}),
	publishedAt: z.string().nullable().openapi({
		example: "2024-01-01T00:00:00.000Z",
		description: "公開日時",
	}),
	updatedAt: z.string().openapi({
		example: "2024-01-02T00:00:00.000Z",
		description: "更新日時",
	}),
	title: z.string().nullable().openapi({
		example: "私の最初のブログ記事",
		description: "記事のタイトル",
	}),
	content: z.string().nullable().openapi({
		example: "これは記事の本文です...",
		description: "記事の本文",
	}),
	viewCount: z.number().int().openapi({
		example: 127,
		description: "記事の閲覧数（言語ごと）",
	}),
	tags: z.array(TagSchema).openapi({
		example: [
			{ id: 1, slug: "typescript" },
			{ id: 2, slug: "react" },
		],
		description: "記事に関連付けられたタグ",
	}),
});

/**
 * ページネーションスキーマ
 */
const PaginationSchema = z.object({
	page: z.number().int().positive().openapi({
		example: 1,
		description: "現在のページ番号",
	}),
	limit: z.number().int().positive().openapi({
		example: 10,
		description: "1ページあたりのアイテム数",
	}),
	total: z.number().int().min(0).openapi({
		example: 100,
		description: "総アイテム数",
	}),
	totalPages: z.number().int().min(0).openapi({
		example: 10,
		description: "総ページ数",
	}),
});

/**
 * エラースキーマ
 */
const ErrorSchema = z.object({
	error: z.object({
		code: z.string().openapi({
			example: "NOT_FOUND",
			description: "エラーコード",
		}),
		message: z.string().openapi({
			example: "Article not found",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * 記事一覧レスポンススキーマ
 */
const ArticlesResponseSchema = z.object({
	data: z.array(ArticleSchema),
	pagination: PaginationSchema,
});

/**
 * 記事一覧取得のルート定義
 */
export const getAllArticlesRoute = createRoute({
	method: "get",
	path: "/",
	request: {
		query: articlesOpenApiQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ArticlesResponseSchema,
				},
			},
			description: "記事一覧の取得成功",
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
	summary: "記事一覧取得",
	description:
		"公開済みの記事一覧を取得します。ページネーションと言語フィルタリングに対応しています。",
});
