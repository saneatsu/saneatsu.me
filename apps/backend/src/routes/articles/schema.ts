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
 * サジェストアイテムのスキーマ
 */
export const SuggestionItemSchema = z
	.object({
		/** 記事のスラッグ */
		slug: z.string().openapi({
			example: "nextjs-basics",
			description: "記事のスラッグ",
		}),
		/** 表示するタイトル（言語に応じた） */
		title: z.string().openapi({
			example: "Next.jsの基本",
			description: "記事または見出しのタイトル",
		}),
		/** サジェストのタイプ */
		type: z.enum(["article", "heading"]).openapi({
			example: "article",
			description: "サジェストのタイプ",
		}),
		/** 見出しのレベル（見出しの場合のみ） */
		headingLevel: z.number().int().min(1).max(6).optional().openapi({
			example: 2,
			description: "見出しのレベル（1-6）",
		}),
		/** 見出しのID（URLアンカー用） */
		headingId: z.string().optional().openapi({
			example: "routing",
			description: "見出しのID（URLアンカー用）",
		}),
		/** 親記事のタイトル（見出しの場合のみ） */
		articleTitle: z.string().optional().openapi({
			example: "Next.jsの基本",
			description: "見出しが属する記事のタイトル",
		}),
	})
	.openapi({
		example: {
			slug: "nextjs-basics",
			title: "Next.jsの基本",
			type: "article",
		},
	});

/**
 * サジェスト取得のクエリパラメータスキーマ
 */
export const ArticleSuggestionsQuerySchema = z.object({
	/** 検索クエリ */
	q: z.string().min(1).openapi({
		example: "Next",
		description: "検索クエリ文字列",
	}),
	/** 言語 */
	lang: z.enum(["ja", "en"]).optional().default("ja").openapi({
		example: "ja",
		description: "表示言語",
	}),
	/** 最大件数 */
	limit: z.string().regex(/^\d+$/).optional().default("20").openapi({
		example: "20",
		description: "取得する最大件数",
	}),
});

/**
 * サジェストレスポンスのスキーマ
 */
export const ArticleSuggestionsResponseSchema = z.object({
	/** サジェスト配列 */
	suggestions: z.array(SuggestionItemSchema),
	/** キャッシュから取得したか */
	fromCache: z.boolean().openapi({
		example: true,
		description: "キャッシュから取得したかどうか",
	}),
});

/**
 * 記事作成リクエストのスキーマ
 */
export const CreateArticleRequestSchema = z
	.object({
		title: z.string().min(1).max(200),
		slug: z.string().regex(/^[a-z0-9-]+$/),
		content: z.string().min(1),
		status: z.enum(["draft", "published"]),
		publishedAt: z.string().optional(),
		tagIds: z.array(z.number()).min(1),
	})
	.openapi({
		example: {
			title: "Next.jsの基本",
			slug: "nextjs-basics",
			content: "# Next.jsとは\n\nNext.jsは...",
			status: "draft",
			tagIds: [1, 2],
		},
	});

/**
 * 記事作成レスポンスのスキーマ
 */
export const CreateArticleResponseSchema = z.object({
	data: z.object({
		id: z.number(),
		title: z.string(),
		slug: z.string(),
		status: z.string(),
		createdAt: z.string(),
	}),
	message: z.string(),
});

/**
 * 記事スラッグチェックのクエリパラメータスキーマ
 */
export const ArticleCheckSlugQuerySchema = z.object({
	slug: z
		.string()
		.regex(/^[a-z0-9-]+$/)
		.openapi({
			example: "nextjs-basics",
			description: "チェックするスラッグ",
		}),
});

/**
 * 記事スラッグチェックレスポンスのスキーマ
 */
export const ArticleCheckSlugResponseSchema = z.object({
	available: z.boolean(),
	message: z.string().optional(),
});

/**
 * 記事一覧取得のクエリパラメータスキーマ
 */
export const ArticlesQuerySchema = z.object({
	page: z.string().regex(/^\d+$/).optional().default("1"),
	limit: z.string().regex(/^\d+$/).optional().default("10"),
	language: z.enum(["ja", "en"]).optional().default("ja"),
	status: z.enum(["all", "draft", "published", "archived"]).optional(),
	search: z.string().optional(),
	sortBy: z.string().optional(),
	sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * 記事タグのスキーマ
 */
export const ArticleTagSchema = z.object({
	id: z.number(),
	slug: z.string(),
	name: z.string(),
});

/**
 * 記事オブジェクトのスキーマ
 */
export const ArticleSchema = z.object({
	id: z.number(),
	title: z.string(),
	slug: z.string(),
	content: z.string().optional(),
	cfImageId: z.string().nullable(),
	status: z.enum(["draft", "published", "archived"]),
	publishedAt: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	viewCount: z.number(),
	totalViewCount: z.number(),
	tags: z.array(ArticleTagSchema),
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
export const ArticleDetailParamSchema = z.object({
	slug: z.string().openapi({
		example: "nextjs-basics",
		description: "記事のスラッグ",
	}),
});

/**
 * 記事詳細取得のクエリパラメータスキーマ
 */
export const ArticleDetailQuerySchema = z.object({
	lang: z.enum(["ja", "en"]).optional().default("ja").openapi({
		example: "ja",
		description: "表示言語",
	}),
});

/**
 * 記事詳細レスポンスのスキーマ
 */
export const ArticleDetailResponseSchema = z.object({
	data: ArticleSchema,
});
