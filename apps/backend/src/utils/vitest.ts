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
export const createMockArticle = (
	overrides: Partial<{
		id?: string;
		slug?: string;
		cfImageId?: string | null;
		status?: string;
		publishedAt?: string;
	}> = {}
) => ({
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
export const createMockArticleTranslation = (
	overrides: Partial<{
		id?: string;
		articleId?: string;
		language?: "ja" | "en";
		title?: string;
		content?: string;
		viewCount?: number;
		createdAt?: string;
		updatedAt?: string;
	}> = {}
) => ({
	id: "test-translation-id",
	articleId: "test-article-id",
	language: "ja",
	title: "テスト記事",
	content: "これはテスト記事の内容です。",
	viewCount: 0,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
	...overrides,
});

/**
 * タグのモックデータファクトリー
 */
export const createMockTag = (
	overrides: Partial<{
		id?: string;
		slug?: string;
		createdAt?: string;
		updatedAt?: string;
	}> = {}
) => ({
	id: "test-tag-id",
	slug: "test-tag",
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
	...overrides,
});

/**
 * タグ翻訳のモックデータファクトリー
 */
export const createMockTagTranslation = (
	overrides: Partial<{
		id?: string;
		tagId?: string;
		language?: "ja" | "en";
		name?: string;
		description?: string;
	}> = {}
) => ({
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
	overrides: Partial<{
		article?: Parameters<typeof createMockArticle>[0];
		translation?: Parameters<typeof createMockArticleTranslation>[0];
	}> = {}
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
		viewCount: translation.viewCount,
	};
};
