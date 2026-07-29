import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema } from "../../../shared/openapi";

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
					schema: errorSchema,
				},
			},
			description: "無効なURL",
		},
		500: {
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
			description: "サーバーエラー",
		},
		504: {
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
			description: "タイムアウト",
		},
	},
	tags: ["OGP"],
	summary: "OGP情報取得",
	description: "指定されたURLのOGP（Open Graph Protocol）情報を取得します。",
});
