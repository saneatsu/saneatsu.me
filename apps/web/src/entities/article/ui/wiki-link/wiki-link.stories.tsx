import type { Meta, StoryObj } from "@storybook/nextjs";
import { HttpResponse, http } from "msw";
import { expect, within } from "storybook/test";

import { WikiLink } from "./wiki-link";

const meta: Meta<typeof WikiLink> = {
	component: WikiLink,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 基本的な記事リンク
 */
export const BasicArticleLink: Story = {
	name: "基本的な記事リンク",
	tags: ["code-only"],
	args: {
		href: "/blog/nextjs-basics",
		children: "nextjs-basics",
	},
	parameters: {
		msw: {
			handlers: [
				http.get("*/api/articles/nextjs-basics", ({ request }) => {
					const url = new URL(request.url);
					const lang = url.searchParams.get("lang") || "ja";
					return HttpResponse.json({
						data: {
							id: "article-1",
							slug: "nextjs-basics",
							title: "Next.jsの基本",
							status: "published",
							language: lang,
						},
					});
				}),
			],
		},
	},
};

/**
 * 日本語アンカー付きリンク
 * 日本語の見出しが正しくデコードされて表示されることを確認
 */
export const JapaneseAnchorLink: Story = {
	name: "日本語アンカー付きリンク",
	tags: ["validation"],
	args: {
		href: "/blog/nextjs-performance#基本的な概念",
		children: "nextjs-performance#基本的な概念",
	},
	parameters: {
		msw: {
			handlers: [
				http.get("*/api/articles/nextjs-performance", ({ request }) => {
					const url = new URL(request.url);
					const lang = url.searchParams.get("lang") || "ja";
					return HttpResponse.json({
						data: {
							id: "article-2",
							slug: "nextjs-performance",
							title: "Next.jsパフォーマンス最適化",
							status: "published",
							language: lang,
						},
					});
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// リンクが表示されるまで待つ
		const link = await canvas.findByRole("link");

		// 表示テキストが正しくデコードされていることを確認
		expect(link).toHaveTextContent("nextjs-performance#基本的な概念");

		// URLエンコードされていないことを確認（%エンコードが含まれていない）
		expect(link.textContent).not.toMatch(/%[0-9A-F]{2}/);
	},
};

/**
 * URLエンコードされたアンカー付きリンク
 * エンコードされた日本語が正しくデコードされることを確認
 */
export const EncodedAnchorLink: Story = {
	name: "URLエンコードされたアンカー付きリンク",
	tags: ["validation"],
	args: {
		href: "/blog/web-optimization#%E5%9F%BA%E6%9C%AC%E7%9A%84%E3%81%AA%E6%A6%82%E5%BF%B5",
		children: "web-optimization#基本的な概念",
	},
	parameters: {
		msw: {
			handlers: [
				http.get("*/api/articles/web-optimization", ({ request }) => {
					const url = new URL(request.url);
					const lang = url.searchParams.get("lang") || "ja";
					return HttpResponse.json({
						data: {
							id: "article-3",
							slug: "web-optimization",
							title: "Webアプリケーション設計",
							status: "published",
							language: lang,
						},
					});
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// リンクが表示されるまで待つ
		const link = await canvas.findByRole("link");

		// 表示テキストが正しくデコードされていることを確認
		expect(link).toHaveTextContent("web-optimization#基本的な概念");

		// URLエンコードが残っていないことを確認
		expect(link.textContent).not.toContain("%E5%9F%BA");
		expect(link.textContent).not.toContain("%E6%9C%AC");
	},
};

/**
 * 英語のアンカー付きリンク
 * 英語のアンカーも正しく表示されることを確認
 */
export const EnglishAnchorLink: Story = {
	name: "英語のアンカー付きリンク",
	tags: ["code-only"],
	args: {
		href: "/blog/react-hooks#useEffect",
		children: "react-hooks#useEffect",
	},
	parameters: {
		msw: {
			handlers: [
				http.get("*/api/articles/react-hooks", ({ request }) => {
					const url = new URL(request.url);
					const lang = url.searchParams.get("lang") || "ja";
					return HttpResponse.json({
						data: {
							id: "article-4",
							slug: "react-hooks",
							title: "React Hooksの完全ガイド",
							status: "published",
							language: lang,
						},
					});
				}),
			],
		},
	},
};

/**
 * 記事が見つからない場合
 */
export const ArticleNotFound: Story = {
	name: "記事が見つからない場合",
	tags: ["code-only"],
	args: {
		href: "/blog/non-existent-article",
		children: "non-existent-article",
	},
	parameters: {
		msw: {
			handlers: [
				http.get("*/api/articles/non-existent-article", () => {
					return HttpResponse.json(
						{ error: { message: "Article not found" } },
						{ status: 404 }
					);
				}),
			],
		},
	},
};

/**
 * ローディング状態
 */
export const LoadingState: Story = {
	name: "ローディング状態",
	tags: ["code-only"],
	args: {
		href: "/blog/slow-loading",
		children: "slow-loading",
	},
	parameters: {
		msw: {
			handlers: [
				http.get("*/api/articles/slow-loading", async () => {
					// 遅延を追加してローディング状態を表示
					await new Promise((resolve) => setTimeout(resolve, 2000));
					return HttpResponse.json({
						data: {
							id: "article-5",
							slug: "slow-loading",
							title: "遅延読み込みテスト",
							status: "published",
							language: "ja",
						},
					});
				}),
			],
		},
	},
};

/**
 * 複雑な日本語アンカー
 * 複数の日本語文字や記号が含まれるアンカーのテスト
 */
export const ComplexJapaneseAnchor: Story = {
	name: "複雑な日本語アンカー",
	tags: ["validation"],
	args: {
		href: "/blog/javascript-es2024#新機能：配列のグループ化",
		children: "javascript-es2024#新機能：配列のグループ化",
	},
	parameters: {
		msw: {
			handlers: [
				http.get("*/api/articles/javascript-es2024", ({ request }) => {
					const url = new URL(request.url);
					const lang = url.searchParams.get("lang") || "ja";
					return HttpResponse.json({
						data: {
							id: "article-6",
							slug: "javascript-es2024",
							title: "JavaScript ES2024新機能",
							status: "published",
							language: lang,
						},
					});
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// リンクが表示されるまで待つ
		const link = await canvas.findByRole("link");

		// 特殊文字を含む日本語が正しく表示されることを確認
		expect(link).toHaveTextContent(
			"javascript-es2024#新機能：配列のグループ化"
		);
	},
};
