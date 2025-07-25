import type { Mock } from "vitest";

/**
 * モックデータベースの型定義
 */
export interface MockDb {
	select: Mock;
	insert: Mock;
	delete: Mock;
	update: Mock;
	$count: Mock;
}

/**
 * 記事のモックデータファクトリー
 */
export const createMockArticle = (overrides: Partial<any> = {}) => ({
	id: "test-article-id",
	slug: "test-article",
	cfImageId: null,
	status: "published",
	publishedAt: "2024-01-01T00:00:00.000Z",
	...overrides,
});

/**
 * 記事翻訳のモックデータファクトリー
 */
export const createMockArticleTranslation = (overrides: Partial<any> = {}) => ({
	id: "test-translation-id",
	articleId: "test-article-id",
	language: "ja",
	title: "テスト記事",
	content: "これはテスト記事の内容です。",
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
	...overrides,
});

/**
 * タグのモックデータファクトリー
 */
export const createMockTag = (overrides: Partial<any> = {}) => ({
	id: "test-tag-id",
	slug: "test-tag",
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
	...overrides,
});

/**
 * タグ翻訳のモックデータファクトリー
 */
export const createMockTagTranslation = (overrides: Partial<any> = {}) => ({
	id: "test-tag-translation-id",
	tagId: "test-tag-id",
	language: "ja",
	name: "テストタグ",
	description: "これはテストタグです。",
	...overrides,
});

/**
 * 記事とその翻訳を含む完全なモックデータを作成
 */
export const createMockArticleWithTranslation = (
	overrides: Partial<any> = {}
) => {
	const article = createMockArticle(overrides.article);
	const translation = createMockArticleTranslation({
		articleId: article.id,
		...overrides.translation,
	});

	return {
		...article,
		title: translation.title,
		content: translation.content,
	};
};
