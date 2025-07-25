import { z } from "@hono/zod-openapi";

/**
 * 記事オブジェクトのスキーマ（APIレスポンス用）
 * DBスキーマとは別にOpenAPI用の定義を行う
 */
export const ArticleSchema = z.object({
	id: z.string().openapi({
		example: "article-id-1234",
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
	publishedAt: z.string().openapi({
		example: "2024-01-01T00:00:00.000Z",
		description: "公開日時",
	}),
	title: z.string().openapi({
		example: "私の最初のブログ記事",
		description: "記事のタイトル",
	}),
	content: z.string().openapi({
		example: "これは記事の本文です...",
		description: "記事の本文",
	}),
});

/**
 * ページネーション情報のスキーマ
 */
export const PaginationSchema = z.object({
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
 * エラーレスポンスのスキーマ
 */
export const ErrorSchema = z.object({
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
 * 記事一覧取得のクエリパラメータスキーマ
 */
export const ArticlesQuerySchema = z.object({
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
 * 記事一覧レスポンスのスキーマ
 */
export const ArticlesResponseSchema = z.object({
	data: z.array(ArticleSchema),
	pagination: PaginationSchema,
});

/**
 * 記事詳細取得のパラメータスキーマ
 */
export const ArticleParamSchema = z.object({
	slug: z.string().openapi({
		example: "my-first-blog-post",
		description: "記事のスラッグ",
	}),
});

/**
 * 記事詳細取得のクエリパラメータスキーマ
 */
export const ArticleDetailQuerySchema = z.object({
	lang: z.enum(["ja", "en"]).optional().openapi({
		example: "ja",
		description: "言語",
	}),
});

/**
 * 記事詳細レスポンスのスキーマ
 */
export const ArticleResponseSchema = z.object({
	data: ArticleSchema,
});