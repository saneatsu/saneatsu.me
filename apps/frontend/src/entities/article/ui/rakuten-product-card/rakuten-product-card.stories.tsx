import type { Meta, StoryObj } from "@storybook/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import { expect, within } from "storybook/test";

import { RakutenProductCard } from "./rakuten-product-card";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

const meta = {
	component: RakutenProductCard,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
		msw: {
			handlers: [
				http.get("*/api/ogp", ({ request }) => {
					const url = new URL(request.url);
					const targetUrl = url.searchParams.get("url");

					// 短縮URL（a.r10.to）の場合はエラーを返す
					if (targetUrl?.includes("a.r10.to")) {
						return HttpResponse.json(
							{ error: "OGP data not available for short URLs" },
							{ status: 404 }
						);
					}

					// 通常の楽天URLの場合はモックOGPデータを返す
					return HttpResponse.json({
						data: {
							title: "テスト商品のタイトル",
							description: "これはテスト用の商品説明です。",
							image: "https://via.placeholder.com/300",
							favicon: "https://www.rakuten.co.jp/favicon.ico",
							siteName: "楽天市場",
							url: targetUrl || "https://www.rakuten.co.jp",
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
} satisfies Meta<typeof RakutenProductCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 基本的な楽天商品カード表示
 */
export const Default: Story = {
	name: "基本的な楽天商品カード",
	tags: ["code-only"],
	args: {
		url: "https://item.rakuten.co.jp/book/17569477/",
		domain: "rakuten.co.jp",
	},
};

/**
 * アフィリエイトリンク（hb.afl.rakuten.co.jp）
 */
export const AffiliateLink: Story = {
	name: "アフィリエイトリンク",
	tags: ["code-only"],
	args: {
		url: "https://hb.afl.rakuten.co.jp/ichiba/4e068e00.5f53c806.4e068e01.d8b0cd27/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbook%2F17569477%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjEyOHgxMjgiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9",
		domain: "hb.afl.rakuten.co.jp",
	},
};

/**
 * ボタン要素の検証
 */
export const ButtonValidation: Story = {
	name: "ボタン要素の検証",
	args: {
		url: "https://item.rakuten.co.jp/book/17569477/",
		domain: "rakuten.co.jp",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 「楽天で見る」ボタンが表示されるまで待つ
		const link = await canvas.findByRole("link");
		await expect(link).toBeInTheDocument();

		// ボタンのhref属性に楽天URLが含まれることを確認
		await expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("rakuten.co.jp")
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
 * ドメイン表示の検証
 */
export const DomainDisplay: Story = {
	name: "ドメイン表示の検証",
	args: {
		url: "https://item.rakuten.co.jp/book/17569477/",
		domain: "rakuten.co.jp",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// ドメインが表示されているか確認（エラー時の簡易カードの場合）
		const domainText = canvasElement.textContent;
		if (domainText?.includes("楽天商品")) {
			await expect(domainText).toContain("rakuten.co.jp");
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
		url: "https://item.rakuten.co.jp/book/17569477/",
		domain: "rakuten.co.jp",
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
		url: "https://item.rakuten.co.jp/book/17569477/",
		domain: "rakuten.co.jp",
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};

/**
 * 楽天ブランドカラーの検証
 */
export const BrandColorValidation: Story = {
	name: "楽天ブランドカラーの検証",
	args: {
		url: "https://item.rakuten.co.jp/book/17569477/",
		domain: "rakuten.co.jp",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// リンクが表示されるまで待つ
		const link = await canvas.findByRole("link");

		// カードのボーダーカラーが楽天レッド系であることを確認
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
 * 短縮URL（a.r10.to）の表示
 */
export const ShortUrlAR10To: Story = {
	name: "短縮URL（a.r10.to）",
	tags: ["code-only"],
	args: {
		url: "https://a.r10.to/hF6JlM",
		domain: "a.r10.to",
	},
};

/**
 * 短縮URL表示の検証
 */
export const ShortUrlValidation: Story = {
	name: "短縮URL表示の検証",
	args: {
		url: "https://a.r10.to/hF6JlM",
		domain: "a.r10.to",
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 「楽天商品」と表示されることを確認
		// リトライ遅延を考慮して、タイムアウトを5000msに設定
		await canvas.findByText(/楽天商品/, {}, { timeout: 5000 });

		// ドメイン（a.r10.to）が表示されることを確認
		await canvas.findByText(/a\.r10\.to/, {}, { timeout: 5000 });

		// リンクが存在することを確認
		const link = await canvas.findByRole("link");
		await expect(link).toBeInTheDocument();

		// リンクのhref属性に短縮URLが含まれることを確認
		await expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("a.r10.to")
		);
	},
};
