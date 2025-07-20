import { z } from "zod";
import {
	articleStatusSchema,
	cloudflareImageIdSchema,
	dateTimeSchema,
	idSchema,
	languageSchema,
	slugSchema,
} from "./common";

/**
 * 記事関連のスキーマ定義
 */

/** 記事翻訳スキーマ */
export const articleTranslationSchema = z.object({
	id: idSchema,
	title: z
		.string()
		.min(1, "タイトルを入力してください")
		.max(200, "タイトルは200文字以内で入力してください"),
	content: z
		.string()
		.min(1, "本文を入力してください")
		.max(50000, "本文は50000文字以内で入力してください"),
	language: languageSchema,
	articleId: idSchema,
});

/** 記事翻訳作成時の入力スキーマ */
export const createArticleTranslationSchema = articleTranslationSchema.omit({
	id: true,
	articleId: true,
});

/** 記事翻訳更新時の入力スキーマ */
export const updateArticleTranslationSchema =
	createArticleTranslationSchema.partial();

/** 記事基本情報スキーマ */
export const articleSchema = z.object({
	id: idSchema,
	slug: slugSchema,
	cfImageId: cloudflareImageIdSchema,
	status: articleStatusSchema,
	publishedAt: z.string().datetime().nullable(),
	createdAt: dateTimeSchema,
	updatedAt: dateTimeSchema,
});

/** 記事作成時の入力スキーマ */
export const createArticleSchema = z.object({
	slug: slugSchema,
	cfImageId: cloudflareImageIdSchema,
	status: articleStatusSchema.default("draft"),
	publishedAt: z.string().datetime().optional(),
	translations: z
		.array(createArticleTranslationSchema)
		.min(1, "少なくとも1つの言語で記事を作成してください")
		.max(2, "最大2言語まで対応しています"),
	tagIds: z
		.array(idSchema)
		.min(1, "少なくとも1つのタグを選択してください")
		.max(10, "タグは最大10個まで選択できます"),
});

/** 記事更新時の入力スキーマ */
export const updateArticleSchema = z.object({
	slug: slugSchema.optional(),
	cfImageId: cloudflareImageIdSchema,
	status: articleStatusSchema.optional(),
	publishedAt: z.string().datetime().nullable().optional(),
	translations: z
		.array(
			updateArticleTranslationSchema.extend({
				id: idSchema.optional(),
				language: languageSchema,
			})
		)
		.optional(),
	tagIds: z
		.array(idSchema)
		.min(1, "少なくとも1つのタグを選択してください")
		.max(10, "タグは最大10個まで選択できます")
		.optional(),
});

/** 記事一覧取得時のクエリパラメータ */
export const articleListQuerySchema = z.object({
	page: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.refine(
			(val) => !Number.isNaN(val) && val > 0,
			"ページ番号は正の整数である必要があります"
		)
		.default("1"),
	limit: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.refine(
			(val) => !Number.isNaN(val) && val > 0 && val <= 100,
			"制限数は1-100の範囲で指定してください"
		)
		.default("10"),
	status: articleStatusSchema.optional(),
	tagId: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.refine((val) => !Number.isNaN(val) && val > 0)
		.optional(),
	language: languageSchema.default("ja"),
});

/** タグ付き記事レスポンス（翻訳含む） */
export const articleWithTranslationsAndTagsSchema = articleSchema.extend({
	translations: z.array(articleTranslationSchema),
	tags: z.array(
		z.object({
			id: idSchema,
			slug: slugSchema,
			name: z.string(),
		})
	),
});

/** 記事一覧レスポンス */
export const articleListResponseSchema = z.object({
	articles: z.array(articleWithTranslationsAndTagsSchema),
	pagination: z.object({
		currentPage: z.number(),
		totalPages: z.number(),
		totalItems: z.number(),
		hasNextPage: z.boolean(),
		hasPreviousPage: z.boolean(),
	}),
});

export type ArticleTranslation = z.infer<typeof articleTranslationSchema>;
export type CreateArticleTranslationInput = z.infer<
	typeof createArticleTranslationSchema
>;
export type UpdateArticleTranslationInput = z.infer<
	typeof updateArticleTranslationSchema
>;
export type Article = z.infer<typeof articleSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>;
export type ArticleWithTranslationsAndTags = z.infer<
	typeof articleWithTranslationsAndTagsSchema
>;
export type ArticleListResponse = z.infer<typeof articleListResponseSchema>;
