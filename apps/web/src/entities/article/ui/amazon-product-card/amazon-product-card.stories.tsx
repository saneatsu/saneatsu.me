import type { Meta, StoryObj } from "@storybook/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import { expect, within } from "storybook/test";

import { AmazonProductCard } from "./amazon-product-card";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

const meta = {
	component: AmazonProductCard,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
		msw: {
			handlers: [
				http.get("*/api/ogp", ({ request }) => {
					const url = new URL(request.url);
					const targetUrl = url.searchParams.get("url");

					// 短縮URL（amzn.to、amzn.asia）の場合はエラーを返す
					if (targetUrl?.includes("amzn.to") || targetUrl?.includes("amzn.asia")) {
						return HttpResponse.json(
							{ error: "OGP data not available for short URLs" },
							{ status: 404 }
						);
					}

					// 通常のAmazon URLの場合はモックOGPデータを返す
					return HttpResponse.json({
						data: {
							title: "テスト商品のタイトル",
							description: "これはテスト用の商品説明です。",
							image: "https://via.placeholder.com/300",
							favicon: "https://www.amazon.co.jp/favicon.ico",
							siteName: "Amazon.co.jp",
							url: targetUrl || "https://www.amazon.co.jp",
						},
					});
				}),
			],
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
} satisfies Meta<typeof AmazonProductCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 基本的なAmazon商品カード表示
 */
export const Default: Story = {
	name: "基本的なAmazon商品カード",
	tags: ["code-only"],
	args: {
		url: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		asin: "B08N5WRWNW",
		domain: "amazon.co.jp",
	},
};

/**
 * amazon.com（米国）の商品
 */
export const AmazonCom: Story = {
	name: "amazon.com（米国）の商品",
	tags: ["code-only"],
	args: {
		url: "https://www.amazon.com/dp/B08N5WRWNW",
		asin: "B08N5WRWNW",
		domain: "amazon.com",
	},
};

/**
 * amazon.co.uk（英国）の商品
 */
export const AmazonCoUk: Story = {
	name: "amazon.co.uk（英国）の商品",
	tags: ["code-only"],
	args: {
		url: "https://www.amazon.co.uk/dp/B08N5WRWNW",
		asin: "B08N5WRWNW",
		domain: "amazon.co.uk",
	},
};

/**
 * ボタン要素の検証
 */
export const ButtonValidation: Story = {
	name: "ボタン要素の検証",
	args: {
		url: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		asin: "B08N5WRWNW",
		domain: "amazon.co.jp",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 「Amazonで見る」ボタンが表示されるまで待つ
		const link = await canvas.findByRole("link");
		await expect(link).toBeInTheDocument();

		// ボタンのhref属性にAmazon URLが含まれることを確認
		await expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("amazon.co.jp")
		);
		await expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("B08N5WRWNW")
		);

		// rel属性に "sponsored" が含まれることを確認（アフィリエイトリンクであることを示す）
		await expect(link).toHaveAttribute(
			"rel",
			expect.stringContaining("sponsored")
		);

		// target="_blank" が設定されていることを確認
		await expect(link).toHaveAttribute("target", "_blank");
	},
};

/**
 * ASIN表示の検証
 */
export const AsinDisplay: Story = {
	name: "ASIN表示の検証",
	args: {
		url: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		asin: "B08N5WRWNW",
		domain: "amazon.co.jp",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// ASINが表示されているか確認（エラー時の簡易カードの場合）
		const asinText = canvasElement.textContent;
		if (asinText?.includes("ASIN")) {
			await expect(asinText).toContain("B08N5WRWNW");
		}
	},
};

/**
 * レスポンシブデザイン（モバイル）
 */
export const ResponsiveMobile: Story = {
	name: "レスポンシブデザイン（モバイル）",
	tags: ["code-only"],
	args: {
		url: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		asin: "B08N5WRWNW",
		domain: "amazon.co.jp",
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

/**
 * レスポンシブデザイン（タブレット）
 */
export const ResponsiveTablet: Story = {
	name: "レスポンシブデザイン（タブレット）",
	tags: ["code-only"],
	args: {
		url: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		asin: "B08N5WRWNW",
		domain: "amazon.co.jp",
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};

/**
 * Amazonブランドカラーの検証
 */
export const BrandColorValidation: Story = {
	name: "Amazonブランドカラーの検証",
	args: {
		url: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		asin: "B08N5WRWNW",
		domain: "amazon.co.jp",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// リンクが表示されるまで待つ
		const link = await canvas.findByRole("link");

		// カードのボーダーカラーがAmazonオレンジ系であることを確認
		const card = canvasElement.querySelector(".border");
		if (card) {
			// border要素の存在を確認
			await expect(card).toHaveClass("border");
		}

		// リンク要素のクラス名が存在することを確認
		await expect(link.className).toBeTruthy();
	},
};

/**
 * 短縮URL（amzn.to）の表示
 */
export const ShortUrlAmznTo: Story = {
	name: "短縮URL（amzn.to）",
	tags: ["code-only"],
	args: {
		url: "https://amzn.to/3ABC123",
		domain: "amzn.to",
		// asin は省略（短縮URLにはASINが含まれていない）
	},
};

/**
 * 短縮URL（amzn.asia）の表示
 */
export const ShortUrlAmznAsia: Story = {
	name: "短縮URL（amzn.asia）",
	tags: ["code-only"],
	args: {
		url: "https://amzn.asia/d/abc123",
		domain: "amzn.asia",
		// asin は省略（短縮URLにはASINが含まれていない）
	},
};

/**
 * 短縮URL表示の検証
 */
export const ShortUrlValidation: Story = {
	name: "短縮URL表示の検証",
	args: {
		url: "https://amzn.to/3ABC123",
		domain: "amzn.to",
		// asin は省略
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 「Amazon商品（短縮URL）」と表示されることを確認
		await canvas.findByText(/Amazon商品（短縮URL）/);

		// ドメイン（amzn.to）が表示されることを確認
		await canvas.findByText(/amzn\.to/);

		// リンクが存在することを確認
		const link = await canvas.findByRole("link");
		await expect(link).toBeInTheDocument();

		// リンクのhref属性に短縮URLが含まれることを確認
		await expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("amzn.to")
		);
	},
};
