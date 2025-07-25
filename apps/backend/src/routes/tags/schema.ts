import { z } from "@hono/zod-openapi";
import {
	ArticleSchema,
	ErrorSchema,
	PaginationSchema,
} from "../articles/schema";

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

// エラースキーマはarticlesからエクスポート
export { ErrorSchema };
