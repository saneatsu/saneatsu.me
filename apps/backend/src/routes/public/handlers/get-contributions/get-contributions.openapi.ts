import { createRoute, z } from "@hono/zod-openapi";

const contributionDaySchema = z.object({
	date: z.string().openapi({ example: "2025-11-11" }),
	updates: z.number().int().openapi({ example: 2 }),
	jaChars: z.number().int().openapi({ example: 800 }),
});

const contributionSummarySchema = z.object({
	startDate: z.string().openapi({ example: "2024-11-12" }),
	endDate: z.string().openapi({ example: "2025-11-11" }),
	totalUpdates: z.number().int().openapi({ example: 320 }),
	totalJaChars: z.number().int().openapi({ example: 145000 }),
	maxUpdates: z.number().int().openapi({ example: 6 }),
	maxJaChars: z.number().int().openapi({ example: 4200 }),
	days: z.array(contributionDaySchema).max(366),
	lastUpdated: z.string().datetime(),
});

const errorSchema = z.object({
	error: z
		.string()
		.openapi({ example: "指定できるrangeは30,90,180,365のみです" }),
});

export const getPublicContributionsRoute = createRoute({
	method: "get",
	path: "/contributions",
	request: {
		query: z.object({
			range: z.enum(["30", "90", "180", "365"]).optional().openapi({
				example: "365",
				description: "日数。30/90/180/365 のいずれか",
			}),
			locale: z.enum(["ja", "en"]).optional().openapi({
				example: "ja",
				description: "UI向けの言語（レスポンス内容は同じ）",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: contributionSummarySchema,
				},
			},
			description: "公開用の執筆データ概要",
		},
		400: {
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
			description: "クエリパラメータが不正",
		},
		500: {
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Public"],
	summary: "公開用の執筆データを取得",
	description: "公開プロフィールなどで使用する執筆データを返します",
});
