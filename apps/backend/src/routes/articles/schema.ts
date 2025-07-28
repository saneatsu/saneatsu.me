import { z } from "@hono/zod-openapi";

/**
 * 記事オブジェクトのスキーマ（APIレスポンス用）
 * DBスキーマとは別にOpenAPI用の定義を行う
 */
export const ArticleSchema = z.object({
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
	status: z.enum(["published", "draft", "archived", "all"]).optional().openapi({
		example: "published",
		description: "記事のステータス",
	}),
	search: z.string().optional().openapi({
		example: "検索キーワード",
		description: "タイトル検索",
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

/**
 * スラッグ重複チェックのクエリパラメータスキーマ
 */
export const SlugCheckQuerySchema = z.object({
	slug: z.string().min(1).openapi({
		example: "my-article-slug",
		description: "チェックするスラッグ",
	}),
});

/**
 * スラッグ重複チェックレスポンスのスキーマ
 */
export const SlugCheckResponseSchema = z.object({
	available: z.boolean().openapi({
		example: true,
		description: "スラッグが利用可能かどうか",
	}),
	message: z.string().optional().openapi({
		example: "このスラッグは既に使用されています",
		description: "メッセージ（利用不可の場合など）",
	}),
});

/**
 * 記事作成のリクエストボディスキーマ
 */
export const ArticleCreateSchema = z.object({
	title: z.string().min(1).max(200).openapi({
		example: "新しい記事のタイトル",
		description: "記事のタイトル（1-200文字）",
	}),
	slug: z
		.string()
		.min(1)
		.max(100)
		.regex(/^[a-z0-9-]+$/)
		.openapi({
			example: "new-article-slug",
			description: "記事のスラッグ（小文字の英数字とハイフンのみ、1-100文字）",
		}),
	content: z.string().min(1).openapi({
		example: "# 記事タイトル\n\nこれは記事の本文です...",
		description: "記事の本文（Markdown形式）",
	}),
	status: z.enum(["draft", "published"]).openapi({
		example: "draft",
		description: "記事のステータス",
	}),
	publishedAt: z.string().datetime().optional().openapi({
		example: "2024-01-01T10:00:00Z",
		description: "公開日時（ISO 8601形式、公開ステータス時のみ）",
	}),
	tagIds: z
		.array(z.number().int().positive())
		.min(1)
		.openapi({
			example: [1, 2, 3],
			description: "タグIDの配列（最低1つ必要）",
		}),
});

/**
 * 記事作成のレスポンススキーマ
 */
export const ArticleCreateResponseSchema = z.object({
	data: ArticleSchema,
	message: z.string().openapi({
		example: "記事が正常に作成されました",
		description: "作成成功メッセージ",
	}),
});
