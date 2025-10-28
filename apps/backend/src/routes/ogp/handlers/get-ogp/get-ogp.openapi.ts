import { createRoute, z } from "@hono/zod-openapi";

/**
 * OGP情報スキーマ
 */
const OgpDataSchema = z.object({
	title: z.string().nullable().openapi({
		example: "React Query との併用 | Feature-Sliced Design",
		description: "ページのタイトル",
	}),
	description: z.string().nullable().openapi({
		example:
			"Feature-Sliced Designアーキテクチャでのデータ取得とキャッシュ管理について",
		description: "ページの説明",
	}),
	image: z.string().nullable().openapi({
		example: "https://feature-sliced.github.io/og-image.png",
		description: "OGP画像URL",
	}),
	favicon: z.string().nullable().openapi({
		example: "https://feature-sliced.github.io/favicon.ico",
		description: "ファビコンURL",
	}),
	siteName: z.string().nullable().openapi({
		example: "Feature-Sliced Design",
		description: "サイト名",
	}),
	url: z.string().openapi({
		example: "https://feature-sliced.github.io/",
		description: "ページURL",
	}),
});

/**
 * OGP取得レスポンススキーマ
 */
const OgpResponseSchema = z.object({
	data: OgpDataSchema,
});

/**
 * エラースキーマ
 */
const ErrorSchema = z.object({
	error: z.object({
		code: z.string().openapi({
			example: "INVALID_URL",
			description: "エラーコード",
		}),
		message: z.string().openapi({
			example: "Invalid URL provided",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * OGP取得クエリスキーマ
 */
const OgpQuerySchema = z.object({
	url: z.string().url().openapi({
		example: "https://feature-sliced.github.io/",
		description: "OGP情報を取得するURL",
	}),
});

/**
 * OGP取得のルート定義
 */
export const getOgpRoute = createRoute({
	method: "get",
	path: "/",
	request: {
		query: OgpQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: OgpResponseSchema,
				},
			},
			description: "OGP情報の取得成功",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "無効なURL",
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
	tags: ["OGP"],
	summary: "OGP情報取得",
	description: "指定されたURLのOGP（Open Graph Protocol）情報を取得します。",
});
