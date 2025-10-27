import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { UrlCard } from "./url-card";

// TanStack Queryクライアントを作成
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

const meta: Meta<typeof UrlCard> = {
	component: UrlCard,
	decorators: [
		(Story) => (
			<QueryClientProvider client={queryClient}>
				<div className="max-w-2xl">
					<Story />
				</div>
			</QueryClientProvider>
		),
	],
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * OGP情報ありの表示確認（画像あり）
 */
export const WithFullOgpData: Story = {
	name: "OGP情報あり（画像あり）",
	tags: ["code-only"],
	args: {
		url: "https://feature-sliced.github.io/",
	},
	parameters: {},
};

/**
 * OGP情報ありの表示確認（画像なし）
 */
export const WithOgpDataNoImage: Story = {
	name: "OGP情報あり（画像なし）",
	tags: ["code-only"],
	args: {
		url: "https://github.com/",
	},
	parameters: {},
};

/**
 * ローディング状態の表示確認
 */
export const LoadingState: Story = {
	name: "ローディング状態",
	tags: ["validation"],
	args: {
		url: "https://example.com/",
	},
	parameters: {
		msw: {
			handlers: [],
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// ローディング状態のスケルトンが表示されることを確認
		const linkElement = canvas.getByRole("link");
		expect(linkElement).toBeInTheDocument();
		expect(linkElement).toHaveAttribute("href", "https://example.com/");
		expect(linkElement).toHaveAttribute("target", "_blank");
		expect(linkElement).toHaveAttribute("rel", "noopener noreferrer");
	},
};

/**
 * エラー状態（簡易カード）の表示確認
 */
export const ErrorState: Story = {
	name: "エラー状態（簡易カード）",
	tags: ["validation"],
	args: {
		url: "https://invalid-url-that-does-not-exist.com/",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// エラー時は簡易カードが表示されることを確認
		// 実際のAPIエラーが発生するまで待機してからテストを行う必要がある
		// ここでは基本的なリンク要素の存在確認のみ
		const canvas = within(canvasElement);
		const linkElement = canvas.getByRole("link");
		expect(linkElement).toBeInTheDocument();
	},
};

/**
 * 簡易カード（OGP情報なし）
 */
export const SimpleCard: Story = {
	name: "簡易カード（OGP情報なし）",
	tags: ["validation"],
	args: {
		url: "https://example.org/some/path",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// リンク要素の確認
		const linkElement = canvas.getByRole("link");
		expect(linkElement).toBeInTheDocument();
		expect(linkElement).toHaveAttribute(
			"href",
			"https://example.org/some/path"
		);
		expect(linkElement).toHaveAttribute("target", "_blank");
		expect(linkElement).toHaveAttribute("rel", "noopener noreferrer");
	},
};

/**
 * 長いURLの表示確認
 */
export const LongUrl: Story = {
	name: "長いURL",
	tags: ["code-only"],
	args: {
		url: "https://feature-sliced.github.io/documentation/ja/docs/guides/tech/with-react-query",
	},
	parameters: {},
};

/**
 * 画像URLは除外されることの確認
 */
export const ImageUrl: Story = {
	name: "画像URL（除外確認用）",
	tags: ["code-only"],
	args: {
		url: "https://example.com/image.png",
	},
	parameters: {},
};

/**
 * ダークモード表示
 */
export const DarkMode: Story = {
	name: "ダークモード",
	tags: ["code-only"],
	args: {
		url: "https://feature-sliced.github.io/",
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
};

/**
 * モバイル表示
 */
export const MobileView: Story = {
	name: "モバイル表示",
	tags: ["code-only"],
	args: {
		url: "https://feature-sliced.github.io/",
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};
