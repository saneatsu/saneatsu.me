import type { Meta, StoryObj } from "@storybook/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, fn, screen, userEvent, within } from "storybook/test";

import type { Article } from "@/shared/model";

import { ArticleActions } from "./article-actions";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

const meta: Meta<typeof ArticleActions> = {
	component: ArticleActions,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
	decorators: [
		(Story) => (
			<QueryClientProvider client={queryClient}>
				<div className="p-4">
					<Story />
				</div>
			</QueryClientProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * テスト用の記事データ
 */
const mockArticle: Article = {
	id: 1,
	slug: "test-article",
	title: "テスト記事",
	content: "これはテスト記事です。",
	status: "published",
	updatedAt: "2024-01-01T00:00:00Z",
	publishedAt: "2024-01-01T00:00:00Z",
	viewCount: 100,
	cfImageId: null,
	tags: [],
};

/**
 * デフォルト状態
 */
export const Default: Story = {
	name: "デフォルト状態",
	tags: ["code-only"],
	args: {
		article: mockArticle,
		onAction: fn(),
	},
};

/**
 * ローディング状態
 */
export const Loading: Story = {
	name: "ローディング状態（削除中）",
	tags: ["code-only"],
	args: {
		article: mockArticle,
		onAction: fn(),
	},
};

/**
 * プレビューボタンクリック
 */
export const PreviewClick: Story = {
	name: "プレビューボタンクリック",
	tags: ["validation"],
	args: {
		article: mockArticle,
		onAction: fn(),
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// プレビューボタンをクリック
		const previewButton = canvas.getByRole("button", { name: /プレビュー/i });
		await userEvent.click(previewButton);

		// Note: window.open のモックは削除されたため、実際の動作の確認はできない
	},
};

/**
 * 削除ダイアログを開く
 */
export const DeleteDialogDisplay: Story = {
	name: "削除ダイアログ表示",
	tags: ["validation"],
	args: {
		article: mockArticle,
		onAction: fn(),
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 削除ボタンをクリック
		const deleteButton = canvas.getByRole("button", { name: /削除/i });
		await userEvent.click(deleteButton);

		// 確認ダイアログが表示されることを確認（Portal経由でレンダリングされるためscreenを使用）
		const dialogTitle = await screen.findByText("記事の削除");
		await expect(dialogTitle).toBeInTheDocument();

		const dialogDescription =
			await screen.findByText(/記事「テスト記事」を削除しますか？/i);
		await expect(dialogDescription).toBeInTheDocument();
	},
};
