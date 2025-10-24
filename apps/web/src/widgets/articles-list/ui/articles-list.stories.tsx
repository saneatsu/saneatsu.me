import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, userEvent, within } from "@storybook/test";
import { HttpResponse, http } from "msw";

import type { Article, ArticlesResponse } from "@/shared/model";

import { ArticlesList } from "./articles-list";

const meta: Meta<typeof ArticlesList> = {
	component: ArticlesList,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
		nextjs: {
			appDirectory: true,
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * テスト用の記事データを生成
 */
function createMockArticle(id: number): Article {
	return {
		id,
		slug: `article-${id}`,
		cfImageId: null,
		status: "published" as const,
		publishedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		title: `テスト記事 ${id}`,
		content: `これはテスト記事 ${id} の内容です。`,
		viewCount: Math.floor(Math.random() * 1000),
		tags: [],
	};
}

/**
 * APIレスポンスを生成
 */
function createMockResponse(
	page: number,
	limit: number,
	total: number
): ArticlesResponse {
	const startIndex = (page - 1) * limit;
	const endIndex = Math.min(startIndex + limit, total);
	const data: Article[] = [];

	for (let i = startIndex; i < endIndex; i++) {
		data.push(createMockArticle(i + 1));
	}

	return {
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

/**
 * 最初のページ（page=1）
 */
export const FirstPage: Story = {
	name: "最初のページ",
	tags: ["code-only"],
	parameters: {
		msw: {
			handlers: [
				http.get("http://localhost:8888/api/articles", ({ request }) => {
					const url = new URL(request.url);
					const page = Number.parseInt(url.searchParams.get("page") || "1");
					const limit = Number.parseInt(url.searchParams.get("limit") || "24");

					return HttpResponse.json(createMockResponse(page, limit, 50));
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ページネーションが表示されるまで待つ
		await canvas.findByText(/ページ 1 \/ 3/);

		// 「前へ」ボタンが無効化されている
		const prevButton = canvas.getByText("前へ");
		expect(prevButton).toBeDisabled();

		// 「次へ」ボタンが有効
		const nextButton = canvas.getByText("次へ");
		expect(nextButton).toBeEnabled();

		// ページ番号が正しい
		expect(canvas.getByText("ページ 1 / 3")).toBeInTheDocument();
	},
};

/**
 * 中間のページ（page=2）
 */
export const MiddlePage: Story = {
	name: "中間のページ",
	tags: ["code-only"],
	parameters: {
		msw: {
			handlers: [
				http.get("http://localhost:8888/api/articles", ({ request }) => {
					const url = new URL(request.url);
					const page = Number.parseInt(url.searchParams.get("page") || "1");
					const limit = Number.parseInt(url.searchParams.get("limit") || "24");

					return HttpResponse.json(createMockResponse(page, limit, 50));
				}),
			],
		},
		nextjs: {
			navigation: {
				query: { page: "2" },
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ページネーションが表示されるまで待つ
		await canvas.findByText(/ページ 2 \/ 3/);

		// 両方のボタンが有効
		const prevButton = canvas.getByText("前へ");
		expect(prevButton).toBeEnabled();

		const nextButton = canvas.getByText("次へ");
		expect(nextButton).toBeEnabled();

		// ページ番号が正しい
		expect(canvas.getByText("ページ 2 / 3")).toBeInTheDocument();
	},
};

/**
 * 最後のページ（page=3）
 */
export const LastPage: Story = {
	name: "最後のページ",
	tags: ["code-only"],
	parameters: {
		msw: {
			handlers: [
				http.get("http://localhost:8888/api/articles", ({ request }) => {
					const url = new URL(request.url);
					const page = Number.parseInt(url.searchParams.get("page") || "1");
					const limit = Number.parseInt(url.searchParams.get("limit") || "24");

					return HttpResponse.json(createMockResponse(page, limit, 50));
				}),
			],
		},
		nextjs: {
			navigation: {
				query: { page: "3" },
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ページネーションが表示されるまで待つ
		await canvas.findByText(/ページ 3 \/ 3/);

		// 「前へ」ボタンが有効
		const prevButton = canvas.getByText("前へ");
		expect(prevButton).toBeEnabled();

		// 「次へ」ボタンが無効化されている
		const nextButton = canvas.getByText("次へ");
		expect(nextButton).toBeDisabled();

		// ページ番号が正しい
		expect(canvas.getByText("ページ 3 / 3")).toBeInTheDocument();
	},
};

/**
 * 単一ページ（総ページ数が1の場合）
 */
export const SinglePage: Story = {
	name: "単一ページ",
	tags: ["code-only"],
	parameters: {
		msw: {
			handlers: [
				http.get("http://localhost:8888/api/articles", ({ request }) => {
					const url = new URL(request.url);
					const page = Number.parseInt(url.searchParams.get("page") || "1");
					const limit = Number.parseInt(url.searchParams.get("limit") || "24");

					// 総数を10件に設定（1ページに収まる）
					return HttpResponse.json(createMockResponse(page, limit, 10));
				}),
			],
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("記事が表示される", async () => {
			// 記事が表示されるまで待つ
			await canvas.findByText("テスト記事 1");
		});

		await step("ページネーションが表示されない", async () => {
			// ページネーションUIが表示されないことを確認
			expect(canvas.queryByText(/ページ/)).not.toBeInTheDocument();
			expect(canvas.queryByText("前へ")).not.toBeInTheDocument();
			expect(canvas.queryByText("次へ")).not.toBeInTheDocument();
		});
	},
};

/**
 * limitが指定されている場合（トップページなど）
 */
export const WithLimit: Story = {
	name: "limit指定あり（トップページ用）",
	tags: ["code-only"],
	args: {
		limit: 6,
	},
	parameters: {
		msw: {
			handlers: [
				http.get("http://localhost:8888/api/articles", ({ request }) => {
					const url = new URL(request.url);
					const page = Number.parseInt(url.searchParams.get("page") || "1");
					const limit = Number.parseInt(url.searchParams.get("limit") || "6");

					return HttpResponse.json(createMockResponse(page, limit, 50));
				}),
			],
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("記事が表示される", async () => {
			// 記事が表示されるまで待つ
			await canvas.findByText("テスト記事 1");
		});

		await step(
			"ページネーションの代わりに「すべての記事を見る」リンクが表示される",
			async () => {
				// ページネーションUIが表示されない
				expect(canvas.queryByText(/ページ/)).not.toBeInTheDocument();

				// 「すべての記事を見る」リンクが表示される
				const link = canvas.getByText(/すべての記事を見る/);
				expect(link).toBeInTheDocument();
				expect(link).toHaveAttribute("href", "/articles");
			}
		);
	},
};

/**
 * ページ切り替えのインタラクション
 */
export const PageSwitching: Story = {
	name: "ページ切り替えのインタラクション",
	tags: ["code-only"],
	parameters: {
		msw: {
			handlers: [
				http.get("http://localhost:8888/api/articles", ({ request }) => {
					const url = new URL(request.url);
					const page = Number.parseInt(url.searchParams.get("page") || "1");
					const limit = Number.parseInt(url.searchParams.get("limit") || "24");

					return HttpResponse.json(createMockResponse(page, limit, 50));
				}),
			],
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("最初のページが表示される", async () => {
			await canvas.findByText(/ページ 1 \/ 3/);
			expect(canvas.getByText("テスト記事 1")).toBeInTheDocument();
		});

		await step("「次へ」ボタンをクリックして2ページ目に移動", async () => {
			const nextButton = canvas.getByText("次へ");
			await userEvent.click(nextButton);

			// 2ページ目が表示される
			await canvas.findByText(/ページ 2 \/ 3/);
		});

		await step("「前へ」ボタンをクリックして1ページ目に戻る", async () => {
			const prevButton = canvas.getByText("前へ");
			await userEvent.click(prevButton);

			// 1ページ目が表示される
			await canvas.findByText(/ページ 1 \/ 3/);
		});
	},
};
