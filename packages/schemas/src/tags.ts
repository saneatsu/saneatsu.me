import { z } from "zod";
import { dateTimeSchema, idSchema, languageSchema, slugSchema } from "./common";
import { i18nMessage } from "./i18n";

/**
 * タグ関連のスキーマ定義
 */

/** タグ翻訳スキーマ */
export const tagTranslationSchema = z.object({
	id: idSchema,
	name: z
		.string()
		.min(1, i18nMessage("validation.custom.tag.nameRequired"))
		.max(50, i18nMessage("validation.custom.tag.nameTooLong")),
	language: languageSchema,
	tagId: idSchema,
});

/** タグ翻訳作成時の入力スキーマ */
export const createTagTranslationSchema = tagTranslationSchema.omit({
	id: true,
	tagId: true,
});

/** タグ翻訳更新時の入力スキーマ */
export const updateTagTranslationSchema = createTagTranslationSchema.partial();

/** タグ基本情報スキーマ */
export const tagSchema = z.object({
	id: idSchema,
	slug: slugSchema,
	createdAt: dateTimeSchema,
	updatedAt: dateTimeSchema,
});

/** タグ作成時の入力スキーマ */
export const createTagSchema = z.object({
	slug: slugSchema,
	translations: z
		.array(createTagTranslationSchema)
		.min(1, i18nMessage("validation.custom.tag.atLeastOneTranslation"))
		.max(2, i18nMessage("validation.custom.tag.maxTranslations")),
});

/** タグ更新時の入力スキーマ */
export const updateTagSchema = z.object({
	slug: slugSchema.optional(),
	translations: z
		.array(
			updateTagTranslationSchema.extend({
				id: idSchema.optional(),
				language: languageSchema,
			})
		)
		.optional(),
});

/** タグ一覧取得時のクエリパラメータ */
export const tagListQuerySchema = z.object({
	language: languageSchema.default("ja"),
	withArticleCount: z
		.string()
		.transform((val) => val === "true")
		.default("false"),
});

/** タグ（翻訳含む）レスポンス */
export const tagWithTranslationsSchema = tagSchema.extend({
	translations: z.array(tagTranslationSchema),
});

/** 記事数付きタグレスポンス */
export const tagWithArticleCountSchema = tagWithTranslationsSchema.extend({
	articleCount: z.number().min(0),
});

/** タグ一覧レスポンス */
export const tagListResponseSchema = z.object({
	tags: z.array(
		z.union([tagWithTranslationsSchema, tagWithArticleCountSchema])
	),
});

/** タグ別記事一覧のクエリパラメータ */
export const tagArticlesQuerySchema = z.object({
	page: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.refine(
			(val) => !Number.isNaN(val) && val > 0,
			i18nMessage("validation.custom.pagination.pagePositive")
		)
		.default("1"),
	limit: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.refine(
			(val) => !Number.isNaN(val) && val > 0 && val <= 100,
			i18nMessage("validation.custom.pagination.limitRange")
		)
		.default("10"),
	language: languageSchema.default("ja"),
});

export type TagTranslation = z.infer<typeof tagTranslationSchema>;
export type CreateTagTranslationInput = z.infer<
	typeof createTagTranslationSchema
>;
export type UpdateTagTranslationInput = z.infer<
	typeof updateTagTranslationSchema
>;
export type Tag = z.infer<typeof tagSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type TagListQuery = z.infer<typeof tagListQuerySchema>;
export type TagWithTranslations = z.infer<typeof tagWithTranslationsSchema>;
export type TagWithArticleCount = z.infer<typeof tagWithArticleCountSchema>;
export type TagListResponse = z.infer<typeof tagListResponseSchema>;
export type TagArticlesQuery = z.infer<typeof tagArticlesQuerySchema>;
