import type { Meta, StoryObj } from "@storybook/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import { expect, within } from "storybook/test";

import { ProductCard } from "./product-card";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

const meta = {
	component: ProductCard,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
		msw: {
			handlers: [
				http.get("*/api/ogp", ({ request }) => {
					const url = new URL(request.url);
					const targetUrl = url.searchParams.get("url");

					// 短縮URL（amzn.to、a.r10.to）の場合はエラーを返す
					if (
						targetUrl?.includes("amzn.to") ||
						targetUrl?.includes("a.r10.to")
					) {
						return HttpResponse.json(
							{ error: "OGP data not available for short URLs" },
							{ status: 404 }
						);
					}

					// 通常のURLの場合はモックOGPデータを返す
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
} satisfies Meta<typeof ProductCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Amazon URLのみの商品カード
 */
export const AmazonOnly: Story = {
	name: "Amazon URLのみ",
	tags: ["code-only"],
	args: {
		amazonUrl: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		amazonAsin: "B08N5WRWNW",
		amazonDomain: "amazon.co.jp",
	},
};

/**
 * 楽天URLのみの商品カード
 */
export const RakutenOnly: Story = {
	name: "楽天URLのみ",
	tags: ["code-only"],
	args: {
		rakutenUrl: "https://a.r10.to/hF6JlM",
		rakutenDomain: "a.r10.to",
	},
};

/**
 * Amazon + 楽天の統合商品カード
 */
export const AmazonAndRakuten: Story = {
	name: "Amazon + 楽天の統合カード",
	tags: ["code-only"],
	args: {
		amazonUrl: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		amazonAsin: "B08N5WRWNW",
		amazonDomain: "amazon.co.jp",
		rakutenUrl:
			"https://hb.afl.rakuten.co.jp/ichiba/test/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbook%2F17569477%2F",
		rakutenDomain: "hb.afl.rakuten.co.jp",
	},
};

/**
 * ボタン要素の検証（Amazon + 楽天）
 */
export const ButtonValidation: Story = {
	name: "ボタン要素の検証（Amazon + 楽天）",
	args: {
		amazonUrl: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		amazonAsin: "B08N5WRWNW",
		amazonDomain: "amazon.co.jp",
		rakutenUrl: "https://a.r10.to/hF6JlM",
		rakutenDomain: "a.r10.to",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// カード全体のリンク要素を取得
		const link = await canvas.findByRole("link");
		await expect(link).toBeInTheDocument();

		// カードのhref属性がAmazon URL（優先）であることを確認
		await expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("amazon.co.jp")
		);

		// rel属性に "sponsored" が含まれることを確認
		await expect(link).toHaveAttribute(
			"rel",
			expect.stringContaining("sponsored")
		);

		// target="_blank" が設定されていることを確認
		await expect(link).toHaveAttribute("target", "_blank");

		// Amazonボタンが存在することを確認
		const amazonButton = await canvas.findByRole("button", {
			name: /Amazon/i,
		});
		await expect(amazonButton).toBeInTheDocument();

		// 楽天ボタンが存在することを確認
		const rakutenButton = await canvas.findByRole("button", { name: /楽天/i });
		await expect(rakutenButton).toBeInTheDocument();
	},
};

/**
 * Amazon URLのみの場合のボタン検証
 */
export const AmazonOnlyButtonValidation: Story = {
	name: "Amazon URLのみのボタン検証",
	args: {
		amazonUrl: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		amazonAsin: "B08N5WRWNW",
		amazonDomain: "amazon.co.jp",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Amazonボタンが存在することを確認
		const amazonButton = await canvas.findByRole("button", {
			name: /Amazon/i,
		});
		await expect(amazonButton).toBeInTheDocument();

		// 楽天ボタンは存在しないことを確認
		const rakutenButton = canvas.queryByRole("button", { name: /楽天/i });
		await expect(rakutenButton).not.toBeInTheDocument();
	},
};

/**
 * 楽天URLのみの場合のボタン検証
 */
export const RakutenOnlyButtonValidation: Story = {
	name: "楽天URLのみのボタン検証",
	args: {
		rakutenUrl:
			"https://hb.afl.rakuten.co.jp/ichiba/test/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbook%2F17569477%2F",
		rakutenDomain: "hb.afl.rakuten.co.jp",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 楽天ボタンが存在することを確認
		const rakutenButton = await canvas.findByRole("button", { name: /楽天/i });
		await expect(rakutenButton).toBeInTheDocument();

		// Amazonボタンは存在しないことを確認
		const amazonButton = canvas.queryByRole("button", { name: /Amazon/i });
		await expect(amazonButton).not.toBeInTheDocument();
	},
};

/**
 * レスポンシブデザイン（モバイル）
 */
export const ResponsiveMobile: Story = {
	name: "レスポンシブデザイン（モバイル）",
	tags: ["code-only"],
	args: {
		amazonUrl: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		amazonAsin: "B08N5WRWNW",
		amazonDomain: "amazon.co.jp",
		rakutenUrl: "https://a.r10.to/hF6JlM",
		rakutenDomain: "a.r10.to",
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
		amazonUrl: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		amazonAsin: "B08N5WRWNW",
		amazonDomain: "amazon.co.jp",
		rakutenUrl: "https://a.r10.to/hF6JlM",
		rakutenDomain: "a.r10.to",
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};

/**
 * 短縮URL（Amazon + 楽天）の表示
 */
export const ShortUrls: Story = {
	name: "短縮URL（Amazon + 楽天）",
	tags: ["code-only"],
	args: {
		amazonUrl: "https://amzn.to/3ABC123",
		amazonDomain: "amzn.to",
		rakutenUrl: "https://a.r10.to/hF6JlM",
		rakutenDomain: "a.r10.to",
		// asin は省略（短縮URLにはASINが含まれていない）
	},
};

/**
 * 短縮URL表示の検証
 */
export const ShortUrlValidation: Story = {
	name: "短縮URL表示の検証",
	args: {
		amazonUrl: "https://amzn.to/3ABC123",
		amazonDomain: "amzn.to",
		rakutenUrl: "https://a.r10.to/hF6JlM",
		rakutenDomain: "a.r10.to",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 「Amazon商品（短縮URL）」と表示されることを確認
		// リトライ遅延を考慮して、タイムアウトを5000msに設定
		await canvas.findByText(/Amazon商品（短縮URL）/, {}, { timeout: 5000 });

		// 両方のドメインが表示されることを確認
		await canvas.findByText(/amzn\.to/, {}, { timeout: 5000 });
		await canvas.findByText(/a\.r10\.to/, {}, { timeout: 5000 });

		// リンクが存在することを確認
		const link = await canvas.findByRole("link");
		await expect(link).toBeInTheDocument();

		// リンクのhref属性にAmazon短縮URL（優先）が含まれることを確認
		await expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("amzn.to")
		);
	},
};

/**
 * ドメイン情報の表示検証
 */
export const DomainDisplayValidation: Story = {
	name: "ドメイン情報の表示検証",
	args: {
		amazonUrl: "https://www.amazon.co.jp/dp/B08N5WRWNW",
		amazonAsin: "B08N5WRWNW",
		amazonDomain: "amazon.co.jp",
		rakutenUrl:
			"https://hb.afl.rakuten.co.jp/ichiba/test/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbook%2F17569477%2F",
		rakutenDomain: "hb.afl.rakuten.co.jp",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// リンクが表示されるまで待つ
		await canvas.findByRole("link");

		// 両方のドメインが表示されることを確認
		const text = canvasElement.textContent || "";
		await expect(text).toContain("amazon.co.jp");
		await expect(text).toContain("hb.afl.rakuten.co.jp");
		await expect(text).toContain("/"); // ドメイン間のスラッシュ
	},
};
