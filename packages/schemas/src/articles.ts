import { z } from "zod";
import {
	articleStatusSchema,
	cloudflareImageIdSchema,
	dateTimeSchema,
	idSchema,
	languageSchema,
	slugSchema,
} from "./common";
import { i18nMessage } from "./i18n";

/**
 * 記事関連のスキーマ定義
 */

/** 記事翻訳スキーマ */
export const articleTranslationSchema = z.object({
	id: idSchema,
	title: z
		.string()
		.min(1, i18nMessage("validation.custom.article.titleRequired"))
		.max(200, i18nMessage("validation.custom.article.titleTooLong")),
	content: z
		.string()
		.min(1, i18nMessage("validation.custom.article.contentRequired"))
		.max(50000, i18nMessage("validation.custom.article.contentTooLong")),
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
	viewCount: z.number().int().min(0).default(0),
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
		.min(1, i18nMessage("validation.custom.article.atLeastOneTranslation"))
		.max(2, i18nMessage("validation.custom.article.maxTranslations")),
	tagIds: z
		.array(idSchema)
		.min(1, i18nMessage("validation.custom.article.atLeastOneTag"))
		.max(10, i18nMessage("validation.custom.article.maxTags")),
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
		.min(1, i18nMessage("validation.custom.article.atLeastOneTag"))
		.max(10, i18nMessage("validation.custom.article.maxTags"))
		.optional(),
});

/** ソート可能なカラム */
export const sortableColumnsSchema = z.enum([
	"createdAt",
	"updatedAt",
	"publishedAt",
	"title",
	"viewCount",
]);

/** ソート順 */
export const sortOrderSchema = z.enum(["asc", "desc"]);

/** 記事一覧取得時のクエリパラメータ */
export const articleListQuerySchema = z.object({
	page: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.refine(
			(val) => !Number.isNaN(val) && val > 0,
			i18nMessage("validation.custom.pagination.pagePositive")
		)
		.default(1),
	limit: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.refine(
			(val) => !Number.isNaN(val) && val > 0 && val <= 200,
			i18nMessage("validation.custom.pagination.limitRange")
		)
		.default(10),
	status: z
		.preprocess((val) => {
			// 配列の場合はそのまま返す
			if (Array.isArray(val)) {
				return val;
			}
			// 文字列の場合はカンマ区切りで分割して配列に変換
			if (typeof val === "string") {
				return val.split(",").filter(Boolean);
			}
			// それ以外の場合はundefined
			return undefined;
		}, z.array(z.string()).optional())
		.optional()
		.transform((val) => {
			// 配列の各要素をarticleStatusSchemaで検証
			if (!val) return undefined;
			return val
				.map((v) => {
					const result = articleStatusSchema.safeParse(v);
					return result.success ? result.data : null;
				})
				.filter((v): v is "published" | "draft" | "archived" => v !== null);
		}),
	tagId: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.refine((val) => !Number.isNaN(val) && val > 0)
		.optional(),
	tagIds: z
		.preprocess((val) => {
			// 配列の場合はそのまま返す
			if (Array.isArray(val)) {
				return val;
			}
			// 文字列の場合はカンマ区切りで分割して配列に変換
			if (typeof val === "string") {
				return val.split(",").filter(Boolean);
			}
			// それ以外の場合はundefined
			return undefined;
		}, z.array(z.string()).optional())
		.optional()
		.transform((val) => {
			// 配列の各要素を数値に変換
			if (!val) return undefined;
			return val
				.map((v) => {
					const num = Number.parseInt(v, 10);
					return !Number.isNaN(num) && num > 0 ? num : null;
				})
				.filter((v): v is number => v !== null);
		}),
	language: languageSchema.default("ja"),
	sortBy: sortableColumnsSchema.optional(),
	sortOrder: sortOrderSchema.default("desc"),
	search: z.string().optional(),
});

/** 記事レスポンス（翻訳含む） */
export const articleWithTranslationsSchema = articleSchema.extend({
	translations: z.array(articleTranslationSchema),
});

/** 記事一覧レスポンス */
export const articleListResponseSchema = z.object({
	articles: z.array(articleWithTranslationsSchema),
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
export type SortableColumns = z.infer<typeof sortableColumnsSchema>;
export type SortOrder = z.infer<typeof sortOrderSchema>;
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>;
export type ArticleWithTranslations = z.infer<
	typeof articleWithTranslationsSchema
>;
export type ArticleListResponse = z.infer<typeof articleListResponseSchema>;
