import type { Meta, StoryObj } from "@storybook/nextjs";
import { HttpResponse, http } from "msw";
import { expect, userEvent, within } from "storybook/test";

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
	status: "published" as const,
	publishedAt: "2024-01-10T00:00:00Z",
	updatedAt: "2024-01-15T10:30:00Z",
	cfImageId: "test-image-id",
	translations: {
		ja: {
			title: "React Hooks完全ガイド",
			content: "# React Hooks完全ガイド\n\nReact Hooksの使い方を解説します。",
		},
		en: {
			title: "Complete Guide to React Hooks",
			content:
				"# Complete Guide to React Hooks\n\nThis guide explains how to use React Hooks.",
		},
	},
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
export const PublishedArticle: Story = {
	name: "デフォルト状態（公開済み記事）",
	tags: ["code-only"],
	args: {
		article: mockArticle,
	},
};

/**
 * 下書き記事
 */
export const DraftArticle: Story = {
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
export const ArchivedArticle: Story = {
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
export const NoThumbnail: Story = {
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
export const NoTags: Story = {
	name: "タグなし記事",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			tags: [],
		},
	},
};

/**
 * 更新日：30分前
 */
export const UpdatedMinutesAgo: Story = {
	name: "更新日：30分前",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			// 現在時刻の30分前を設定
			updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		},
	},
};

/**
 * 更新日：5時間前
 */
export const UpdatedHoursAgo: Story = {
	name: "更新日：5時間前",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			// 現在時刻の5時間前を設定
			updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
		},
	},
};

/**
 * 更新日：3日前
 */
export const UpdatedDaysAgo: Story = {
	name: "更新日：3日前",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			// 現在時刻の3日前を設定
			updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		},
	},
};

/**
 * 更新日：15日前（絶対日付のみ表示）
 */
export const UpdatedLongAgo: Story = {
	name: "更新日：15日前（絶対日付のみ表示）",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			// 現在時刻の15日前を設定
			updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
		},
	},
};

/**
 * プレビュー言語切り替えテスト（日本語 → 英語）
 */
export const PreviewLanguageSwitchToEnglish: Story = {
	name: "プレビュー言語切り替え（日本語 → 英語）",
	args: {
		article: mockArticle,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// すべてのタブリストを取得（1つ目: タイトル言語、2つ目: プレビュー言語）
		const tablists = canvas.getAllByRole("tablist");
		expect(tablists).toHaveLength(2);

		// 2つ目のタブリスト（プレビュー言語）の中のタブを取得
		const previewTablist = tablists[1];
		const tabs = within(previewTablist).getAllByRole("tab");

		const japaneseTab = tabs.find((tab) => tab.textContent === "日本語");
		const englishTab = tabs.find((tab) => tab.textContent === "English");

		if (!japaneseTab || !englishTab) {
			throw new Error("言語タブが見つかりません");
		}

		// 最初は日本語タブが選択されていることを確認
		await expect(japaneseTab).toHaveAttribute("data-state", "active");

		// 英語タブをクリック
		await user.click(englishTab);

		// 英語タブが選択されていることを確認
		await expect(englishTab).toHaveAttribute("data-state", "active");
		await expect(japaneseTab).toHaveAttribute("data-state", "inactive");
	},
};

/**
 * プレビュー言語切り替えテスト（英語 → 日本語）
 */
export const PreviewLanguageSwitchToJapanese: Story = {
	name: "プレビュー言語切り替え（英語 → 日本語）",
	args: {
		article: mockArticle,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// すべてのタブリストを取得（1つ目: タイトル言語、2つ目: プレビュー言語）
		const tablists = canvas.getAllByRole("tablist");
		expect(tablists).toHaveLength(2);

		// 2つ目のタブリスト（プレビュー言語）の中のタブを取得
		const previewTablist = tablists[1];
		const tabs = within(previewTablist).getAllByRole("tab");

		const japaneseTab = tabs.find((tab) => tab.textContent === "日本語");
		const englishTab = tabs.find((tab) => tab.textContent === "English");

		if (!japaneseTab || !englishTab) {
			throw new Error("言語タブが見つかりません");
		}

		// 最初は日本語タブが選択されていることを確認
		await expect(japaneseTab).toHaveAttribute("data-state", "active");

		// 英語タブをクリック
		await user.click(englishTab);

		// 英語タブが選択されていることを確認
		await expect(englishTab).toHaveAttribute("data-state", "active");

		// 日本語タブをクリック
		await user.click(japaneseTab);

		// 日本語タブが選択されていることを確認
		await expect(japaneseTab).toHaveAttribute("data-state", "active");
		await expect(englishTab).toHaveAttribute("data-state", "inactive");
	},
};
