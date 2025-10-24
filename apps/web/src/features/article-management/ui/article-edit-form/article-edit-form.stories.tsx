import type { Meta, StoryObj } from "@storybook/nextjs";
import { HttpResponse, http } from "msw";

import { ArticleEditForm } from "./article-edit-form";

const meta: Meta<typeof ArticleEditForm> = {
	component: ArticleEditForm,
	parameters: {
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/admin/articles/edit/1",
			},
		},
		viewport: {
			defaultViewport: "reset",
		},
		// MSWハンドラーを設定
		msw: {
			handlers: [
				// スラッグチェックAPI
				http.get("*/api/articles/check-slug", ({ request }) => {
					const url = new URL(request.url);
					const slug = url.searchParams.get("slug");
					return HttpResponse.json({
						available: slug !== "existing-slug",
						message:
							slug === "existing-slug"
								? "このスラッグは既に使用されています"
								: null,
					});
				}),
				// 記事更新API
				http.put("*/api/articles/:id", async ({ request, params }) => {
					const body = (await request.json()) as Record<string, unknown>;
					return HttpResponse.json({
						data: {
							...body,
							id: params.id,
							updatedAt: new Date().toISOString(),
						},
					});
				}),
				// Wiki Linkサジェスト
				http.get("*/api/articles/suggestions", () => {
					return HttpResponse.json({
						suggestions: [],
						fromCache: false,
					});
				}),
				// タグ一覧API
				http.get("*/api/tags", () => {
					return HttpResponse.json({
						data: [
							{
								id: 1,
								slug: "react",
								translations: { ja: "React", en: "React" },
								usageCount: 5,
								articleCount: 5,
								createdAt: "2024-01-01T00:00:00Z",
								updatedAt: "2024-01-01T00:00:00Z",
							},
							{
								id: 2,
								slug: "typescript",
								translations: { ja: "TypeScript", en: "TypeScript" },
								usageCount: 3,
								articleCount: 3,
								createdAt: "2024-01-01T00:00:00Z",
								updatedAt: "2024-01-01T00:00:00Z",
							},
						],
					});
				}),
			],
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * テスト用の記事データ
 */
const mockArticle = {
	id: 1,
	title: "React Hooks完全ガイド",
	slug: "react-hooks-guide",
	content: "# React Hooks完全ガイド\n\nReact Hooksの使い方を解説します。",
	status: "published",
	publishedAt: "2024-01-10T00:00:00Z",
	cfImageId: "test-image-id",
	tags: [
		{
			id: 1,
			slug: "react",
			translations: { ja: "React", en: "React" },
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			articleCount: 5,
		},
	],
};

/**
 * デフォルト状態（公開済み記事）
 */
export const 公開済み記事: Story = {
	name: "デフォルト状態（公開済み記事）",
	tags: ["code-only"],
	args: {
		article: mockArticle,
	},
};

/**
 * 下書き記事
 */
export const 下書き記事: Story = {
	name: "下書き記事",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			status: "draft",
			publishedAt: null,
		},
	},
};

/**
 * アーカイブ済み記事
 */
export const アーカイブ済み記事: Story = {
	name: "アーカイブ済み記事",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			status: "archived",
		},
	},
};

/**
 * サムネイルなし記事
 */
export const サムネイルなし: Story = {
	name: "サムネイルなし記事",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			cfImageId: null,
		},
	},
};

/**
 * タグなし記事
 */
export const タグなし: Story = {
	name: "タグなし記事",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			tags: [],
		},
	},
};
