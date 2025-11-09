import type { Meta, StoryObj } from "@storybook/nextjs";
import { HttpResponse, http } from "msw";
import { expect, waitFor, within } from "storybook/test";

import { MarkdownPreview } from "./markdown-preview";

const meta: Meta<typeof MarkdownPreview> = {
	component: MarkdownPreview,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 基本的なMarkdown要素の表示確認
 */
export const BasicMarkdownElements: Story = {
	name: "基本的なMarkdown要素",
	tags: ["validation"],
	args: {
		content: `# 見出し1

## 見出し2

### 見出し3

これは段落です。通常のテキストが表示されます。

- リスト項目1
- リスト項目2
- リスト項目3

1. 順序付きリスト1
2. 順序付きリスト2
3. 順序付きリスト3`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 見出しの確認
		const h1 = canvas.getByRole("heading", { level: 1, name: "見出し1" });
		expect(h1).toBeInTheDocument();

		const h2 = canvas.getByRole("heading", { level: 2, name: "見出し2" });
		expect(h2).toBeInTheDocument();

		const h3 = canvas.getByRole("heading", { level: 3, name: "見出し3" });
		expect(h3).toBeInTheDocument();

		// 段落の確認
		const paragraph = canvas.getByText(/これは段落です/);
		expect(paragraph).toBeInTheDocument();

		// リストの確認
		const lists = canvas.getAllByRole("list");
		expect(lists.length).toBeGreaterThanOrEqual(2); // 順序なしと順序付き
	},
};

/**
 * コードブロックのテスト
 */
export const CodeBlock: Story = {
	name: "コードブロック",
	tags: ["validation"],
	args: {
		content: `# コードブロックの例

TypeScriptのコードブロック：

\`\`\`typescript
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "John",
  age: 30
};

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

JavaScriptのコードブロック：

\`\`\`javascript
const sum = (a, b) => a + b;
console.log(sum(1, 2)); // 3
\`\`\``,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// TypeScriptコードブロックの確認（シンタックスハイライトでテキストが分割されるため、textContentで確認）
		const codeElements = canvasElement.querySelectorAll("pre code");
		const tsCodeBlock = Array.from(codeElements).find((code) =>
			code.textContent?.includes("interface User")
		);
		expect(tsCodeBlock).toBeTruthy();

		// JavaScriptコードブロックの確認
		const jsCodeBlock = Array.from(codeElements).find((code) =>
			code.textContent?.includes("const sum = ")
		);
		expect(jsCodeBlock).toBeTruthy();

		// コードブロック要素の確認
		const codeBlocks = canvasElement.querySelectorAll("pre");
		expect(codeBlocks.length).toBeGreaterThanOrEqual(2);
	},
};

/**
 * インラインコードのテスト
 */
export const InlineCode: Story = {
	name: "インラインコード",
	tags: ["validation"],
	args: {
		content: `# インラインコードの例

このテキストには\`インラインコード\`が含まれています。

変数\`userName\`や関数\`getUserData()\`のようにコード内の要素を参照できます。

\`npm install\`コマンドを実行してパッケージをインストールします。`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// インラインコードの確認
		const inlineCode1 = canvas.getByText("インラインコード");
		expect(inlineCode1).toBeInTheDocument();

		const inlineCode2 = canvas.getByText("userName");
		expect(inlineCode2).toBeInTheDocument();

		const inlineCode3 = canvas.getByText("npm install");
		expect(inlineCode3).toBeInTheDocument();
	},
};

/**
 * ブロッククォートのテスト
 */
export const Blockquote: Story = {
	name: "ブロッククォート",
	tags: ["validation"],
	args: {
		content: `# ブロッククォートの例

> これはブロッククォートです。
> 引用や注意書きに使用されます。

通常のテキスト

> ## ブロッククォート内の見出し
>
> ブロッククォート内に見出しやその他の要素を含めることができます。
>
> - リスト項目1
> - リスト項目2`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// ブロッククォートの確認
		const quote1 = canvas.getByText(/これはブロッククォート/);
		expect(quote1).toBeInTheDocument();

		// ブロッククォート要素の確認
		const blockquotes = canvasElement.querySelectorAll("blockquote");
		expect(blockquotes.length).toBeGreaterThanOrEqual(1);

		// ブロッククォート内の見出しの確認
		const h2 = canvas.getByRole("heading", {
			level: 2,
			name: "ブロッククォート内の見出し",
		});
		expect(h2).toBeInTheDocument();
	},
};

/**
 * 表のテスト
 */
export const Table: Story = {
	name: "表",
	tags: ["validation"],
	args: {
		content: `# 表の例

| 名前 | 年齢 | 職業 |
|------|------|------|
| 太郎 | 25 | エンジニア |
| 花子 | 30 | デザイナー |
| 次郎 | 28 | プロダクトマネージャー |

右寄せと左寄せ：

| 項目 | 金額 | 説明 |
|:-----|-----:|------|
| 商品A | 1,000円 | 説明A |
| 商品B | 2,500円 | 説明B |
| 合計 | 3,500円 | - |`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 表の確認
		const tables = canvas.getAllByRole("table");
		expect(tables.length).toBe(2);

		// セルの内容確認
		const taro = canvas.getByText("太郎");
		expect(taro).toBeInTheDocument();

		const engineer = canvas.getByText("エンジニア");
		expect(engineer).toBeInTheDocument();

		const total = canvas.getByText("合計");
		expect(total).toBeInTheDocument();
	},
};

/**
 * Wiki Linkのテスト
 */
export const WikiLink: Story = {
	name: "Wiki Link",
	tags: ["validation"],
	args: {
		content: `# Wiki Linkの例

記事へのリンク：[[react-hooks-guide]]

見出しへのリンク：[[react-hooks-guide#useState]]

複数のWiki Link：
- [[typescript-basics]]
- [[next-js-guide]]
- [[git-commands#branch]]`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 見出しが表示されることを確認
		const heading = canvas.getByRole("heading", {
			level: 1,
			name: "Wiki Linkの例",
		});
		expect(heading).toBeInTheDocument();

		// リストが表示されることを確認
		const list = canvas.getByRole("list");
		expect(list).toBeInTheDocument();

		// test-storybook環境ではWikiLinkコンポーネントが動的インポートで
		// 正しく動作しないため、WikiLink自体のテストはスキップ
		// 実際のブラウザでの動作確認が必要
	},
};

/**
 * タグのテスト
 */
export const Tags: Story = {
	name: "タグ",
	tags: ["code-only"],
	args: {
		content: `# タグの例

この記事には #React #TypeScript #Next.js のタグが付いています。

段落内のタグ：この機能は #experimental なので注意が必要です。

複数のタグ：
- #frontend
- #backend
- #fullstack`,
		language: "ja",
	},
	parameters: {},
};

/**
 * GFM機能のテスト
 */
export const GfmFeatures: Story = {
	name: "GFM機能（取り消し線、タスクリスト、自動リンク）",
	tags: ["validation"],
	args: {
		content: `# GitHub Flavored Markdownの機能

## 取り消し線

~~これは取り消し線です~~

通常のテキストと~~取り消されたテキスト~~が混在します。

## タスクリスト

- [x] 完了したタスク
- [x] もう一つの完了タスク
- [ ] 未完了のタスク
- [ ] まだやることがあるタスク

## 自動リンク

URLを直接書くと自動リンクになります：https://example.com

メールアドレスも：test@example.com`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 取り消し線の確認
		const strikethrough = canvas.getByText("これは取り消し線です");
		expect(strikethrough).toBeInTheDocument();

		// タスクリストの確認
		const checkboxes = canvas.getAllByRole("checkbox");
		expect(checkboxes.length).toBe(4);

		// チェック済みのチェックボックス
		expect(checkboxes[0]).toBeChecked();
		expect(checkboxes[1]).toBeChecked();

		// 未チェックのチェックボックス
		expect(checkboxes[2]).not.toBeChecked();
		expect(checkboxes[3]).not.toBeChecked();

		// 自動リンクの確認
		const autoLink = canvas.getByRole("link", {
			name: "https://example.com",
		});
		expect(autoLink).toBeInTheDocument();
		expect(autoLink).toHaveAttribute("href", "https://example.com");
	},
};

/**
 * 複雑なネスト構造のテスト
 */
export const ComplexNestedStructure: Story = {
	name: "複雑なネスト構造",
	tags: ["validation"],
	args: {
		content: `# 複雑なMarkdown構造

## リストのネスト

- トップレベル項目1
  - ネストレベル1-1
    - ネストレベル1-1-1
    - ネストレベル1-1-2
  - ネストレベル1-2
- トップレベル項目2
  - ネストレベル2-1

## ブロッククォート内のコードブロック

> プログラムの例：
>
> \`\`\`typescript
> const example = "nested code";
> \`\`\`
>
> これがブロッククォート内のコードです。

## リスト内のコードブロック

1. 最初のステップ

   \`\`\`bash
   npm install
   \`\`\`

2. 次のステップ

   \`\`\`bash
   npm start
   \`\`\``,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// ネストされたリストの確認
		const topItem1 = canvas.getByText("トップレベル項目1");
		expect(topItem1).toBeInTheDocument();

		const nestedItem = canvas.getByText("ネストレベル1-1-1");
		expect(nestedItem).toBeInTheDocument();

		// ブロッククォート内のコードブロックの確認（シンタックスハイライトでテキストが分割されるため、textContentで確認）
		const codeElements = canvasElement.querySelectorAll("pre code");
		const nestedCodeBlock = Array.from(codeElements).find((code) =>
			code.textContent?.includes("const example")
		);
		expect(nestedCodeBlock).toBeTruthy();

		// リスト内のコードブロックの確認
		const npmInstall = canvas.getAllByText("npm install");
		expect(npmInstall.length).toBeGreaterThan(0);
	},
};

/**
 * 空のコンテンツのテスト
 */
export const EmptyContent: Story = {
	name: "空のコンテンツ",
	tags: ["validation"],
	args: {
		content: "",
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// proseクラスが適用されたdivが存在することを確認
		const proseDiv = canvasElement.querySelector(".prose");
		expect(proseDiv).toBeInTheDocument();

		// 内容が空であることを確認
		expect(proseDiv?.textContent).toBe("");
	},
};

/**
 * ダークモード表示のテスト
 */
export const DarkModeDisplay: Story = {
	name: "ダークモード表示",
	tags: ["code-only"],
	args: {
		content: `# ダークモード対応

これはダークモードでの表示確認用のコンテンツです。

## コードブロック

\`\`\`typescript
const darkMode = true;
console.log("Dark mode is enabled");
\`\`\`

## ブロッククォート

> ダークモードでは背景色が変わります。

## リスト

- 項目1
- 項目2
- 項目3

[[wiki-link]] や #tag もダークモードで適切に表示されます。`,
		language: "ja",
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
};

/**
 * 英語ロケールのテスト
 */
export const EnglishLocale: Story = {
	name: "英語ロケール",
	tags: ["validation"],
	args: {
		content: `# English Content

This is an example of English content.

## Code Block

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

## List

- Item 1
- Item 2
- Item 3

## Wiki Link

Check out [[react-hooks-guide]] for more information.

## Tags

This article is tagged with #React #TypeScript #English`,
		language: "en",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 英語コンテンツの確認
		const heading = canvas.getByRole("heading", {
			level: 1,
			name: "English Content",
		});
		expect(heading).toBeInTheDocument();

		const englishText = canvas.getByText(/This is an example/);
		expect(englishText).toBeInTheDocument();

		// test-storybook環境ではWikiLinkコンポーネントが動的インポートで
		// 正しく動作しないため、WikiLink自体のテストはスキップ
		// 実際のブラウザでの動作確認が必要
	},
};

/**
 * Cloudflare Images（ArticleImageコンポーネント）のテスト
 */
export const CloudflareImages: Story = {
	name: "Cloudflare Images（ArticleImage統合）",
	tags: ["code-only"],
	args: {
		content: `# Cloudflare Imagesを使った画像表示

Cloudflare Images URLを含む画像は、ArticleImageコンポーネントでレンダリングされ、クリックでLightbox表示されます。

![記事内画像1](https://imagedelivery.net/abc123/image-id-1/medium)

テキストを挟んで複数の画像：

![記事内画像2](https://imagedelivery.net/abc123/image-id-2/medium)

## 画像とテキストの組み合わせ

![サンプル画像](https://imagedelivery.net/abc123/sample-image/medium)

画像の後にテキストが続きます。画像をクリックするとLightboxで拡大表示されます。`,
		language: "ja",
	},
	parameters: {},
};

/**
 * 通常の画像URLのテスト
 */
export const RegularImages: Story = {
	name: "通常の画像URL（imgタグ）",
	tags: ["code-only"],
	args: {
		content: `# 通常の画像URL

Cloudflare Images以外の画像URLは、通常のimgタグでレンダリングされます。

![外部画像1](https://picsum.photos/800/600)

テキストを挟んで：

![外部画像2](https://via.placeholder.com/600x400)

## 複数の画像

![サンプル1](https://picsum.photos/400/300)
![サンプル2](https://picsum.photos/500/350)`,
		language: "ja",
	},
	parameters: {},
};

/**
 * Cloudflare Imagesと通常画像の混在
 */
export const MixedImages: Story = {
	name: "Cloudflare Imagesと通常画像の混在",
	tags: ["code-only"],
	args: {
		content: `# 異なる画像タイプの混在

## Cloudflare Images

![記事画像](https://imagedelivery.net/abc123/article-image/medium)

## 通常の外部画像

![外部画像](https://picsum.photos/800/600)

両方のタイプの画像が同一記事内に存在する場合でも、正しくレンダリングされます。

- Cloudflare Images → ArticleImageコンポーネント（Lightbox対応）
- 通常の画像URL → 通常のimgタグ`,
		language: "ja",
	},
	parameters: {},
};

/**
 * YouTube埋め込みの表示確認（基本）
 */
export const YouTubeEmbedBasic: Story = {
	name: "YouTube埋め込み（基本）",
	tags: ["code-only"],
	args: {
		content: `# YouTube埋め込みの例

以下はYouTubeの動画埋め込みです。

https://www.youtube.com/watch?v=dQw4w9WgXcQ

この動画はMarkdown内のURL単独行から自動的に埋め込まれます。`,
		language: "ja",
	},
	parameters: {},
};

/**
 * YouTube埋め込みの表示確認（タイムスタンプ付き）
 */
export const YouTubeEmbedWithTimestamp: Story = {
	name: "YouTube埋め込み（タイムスタンプ付き）",
	tags: ["code-only"],
	args: {
		content: `# タイムスタンプ付きYouTube埋め込み

URLにタイムスタンプパラメータを含めることで、指定した時刻から再生を開始できます。

https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s

この動画は10秒の位置から再生されます。`,
		language: "ja",
	},
	parameters: {},
};

/**
 * YouTube埋め込みの表示確認（ショートURL）
 */
export const YouTubeEmbedShortUrl: Story = {
	name: "YouTube埋め込み（ショートURL）",
	tags: ["code-only"],
	args: {
		content: `# ショートURL形式のYouTube埋め込み

youtu.be形式のショートURLにも対応しています。

https://youtu.be/jNQXAC9IVRw

ショートURL形式でも正しく動画が埋め込まれます。`,
		language: "ja",
	},
	parameters: {},
};

/**
 * YouTube埋め込みの表示確認（複数動画）
 */
export const YouTubeEmbedMultiple: Story = {
	name: "YouTube埋め込み（複数動画）",
	tags: ["code-only"],
	args: {
		content: `# 複数のYouTube動画

記事内に複数のYouTube動画を埋め込むこともできます。

## 動画1

https://www.youtube.com/watch?v=dQw4w9WgXcQ

## 動画2

https://youtu.be/jNQXAC9IVRw

各動画は独立して埋め込まれ、個別に再生できます。`,
		language: "ja",
	},
	parameters: {},
};

/**
 * YouTube埋め込みとテキストの混在
 */
export const YouTubeEmbedWithText: Story = {
	name: "YouTube埋め込みとテキストの混在",
	tags: ["validation"],
	args: {
		content: `# YouTube埋め込みとテキストの混在

YouTubeの埋め込みは単独行のURLのみが対象です。

通常のテキスト内の[YouTubeリンク](https://www.youtube.com/watch?v=dQw4w9WgXcQ)は埋め込まれず、通常のリンクとして表示されます。

https://www.youtube.com/watch?v=jNQXAC9IVRw

上記のように単独行のYouTube URLのみが動画プレーヤーとして埋め込まれます。`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 通常のリンクが存在することを確認
		const link = canvas.getByRole("link", { name: /YouTubeリンク/ });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute(
			"href",
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ"
		);

		// iframe（埋め込み動画）が存在することを確認
		// YouTube埋め込みのレンダリングを待つためにwaitForを使用
		await waitFor(
			() => {
				const iframe = canvasElement.querySelector("iframe");
				expect(iframe).toBeInTheDocument();
				expect(iframe).toHaveAttribute(
					"src",
					expect.stringContaining("jNQXAC9IVRw")
				);
			},
			{ timeout: 5000 }
		);
	},
};

/**
 * Amazon商品カードの埋め込み（基本）
 */
export const AmazonProductCardBasic: Story = {
	name: "Amazon商品カードの埋め込み（基本）",
	tags: ["code-only"],
	args: {
		content: `# Amazon商品の紹介

以下はAmazon商品のリンクです。

https://www.amazon.co.jp/dp/B08N5WRWNW

商品の詳細はリンクをクリックして確認できます。`,
		language: "ja",
	},
	parameters: {},
};

/**
 * Amazon商品カードの埋め込み（複数商品）
 */
export const AmazonProductCardMultiple: Story = {
	name: "Amazon商品カードの埋め込み（複数商品）",
	tags: ["code-only"],
	args: {
		content: `# おすすめ商品

## 商品1

https://www.amazon.co.jp/dp/B08N5WRWNW

## 商品2

https://www.amazon.co.jp/dp/B0CX23V2ZK

各商品は独立したカードとして表示されます。`,
		language: "ja",
	},
	parameters: {},
};

/**
 * Amazon商品カード（通常URL・OGP表示）
 */
export const AmazonProductCardOgpDisplay: Story = {
	name: "Amazon商品カード（通常URL・OGP表示）",
	tags: ["validation"],
	args: {
		content: `# Amazon商品の紹介

以下はAmazon商品のリンクです。

<https://www.amazon.co.jp/GitLab%E3%81%AB%E5%AD%A6%E3%81%B6-%E4%B8%96%E7%95%8C%E6%9C%80%E5%85%88%E7%AB%AF%E3%81%AE%E3%83%AA%E3%83%A2%E3%83%BC%E3%83%88%E7%B5%84%E7%B9%94%E3%81%AE%E3%81%A4%E3%81%8F%E3%82%8A%E3%81%8B%E3%81%9F-%E3%83%89%E3%82%AD%E3%83%A5%E3%83%A1%E3%83%B3%E3%83%88%E3%81%AE%E6%B4%BB%E7%94%A8%E3%81%A7%E3%82%AA%E3%83%95%E3%82%A3%E3%82%B9%E3%81%AA%E3%81%97%E3%81%A7%E3%82%82%E6%9C%80%E5%A4%A7%E3%81%AE%E6%88%90%E6%9E%9C%E3%82%92%E5%87%BA%E3%81%99%E3%82%B0%E3%83%AD%E3%83%BC%E3%83%90%E3%83%AB%E4%BC%81%E6%A5%AD%E3%81%AE%E3%81%97%E3%81%8F%E3%81%BF-%E5%8D%83%E7%94%B0-%E5%92%8C%E5%A4%AE-ebook/dp/B0CBR9GYF6?dib=eyJ2IjoiMSJ9.wPvtjLDn6aoctleRNeYTpQ.5tI0XZqdzwUjx7NEyfSuWEffEQgSpriwCaTeF6nsIF0&dib_tag=se&keywords=9784798183916&qid=1761829153&s=digital-text&sr=1-1&linkCode=ll1&tag=173069-22&linkId=d492be75069a8cce22d78162985a2ded&language=ja_JP&ref_=as_li_ss_tl>

OGP情報が取得されてカード形式で表示されます。`,
		language: "ja",
	},
	parameters: {
		msw: {
			handlers: [
				// NextAuthのセッションをモック（空のセッション）
				http.get("/api/auth/session", () => {
					return HttpResponse.json({});
				}),
				http.get("http://localhost:8888/api/ogp", ({ request }) => {
					const url = new URL(request.url);
					const targetUrl = url.searchParams.get("url");

					// ASIN B0CBR9GYF6を含むAmazon URLにマッチ
					if (targetUrl?.includes("B0CBR9GYF6")) {
						return HttpResponse.json({
							data: {
								title: "GitLabに学ぶ 世界最先端のリモート組織のつくりかた",
								description:
									"ドキュメントの活用でオフィスなしでも最大の成果を出すグローバル企業のしくみ",
								image: "https://m.media-amazon.com/images/I/sample-image.jpg",
								favicon: "https://www.amazon.co.jp/favicon.ico",
								siteName: "Amazon.co.jp",
								url: targetUrl,
							},
						});
					}

					return HttpResponse.json({ error: "Not found" }, { status: 404 });
				}),
			],
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// AmazonProductCardコンポーネントのレンダリングを待つ
		await waitFor(
			() => {
				// リンク要素の確認
				const linkElement = canvasElement.querySelector(
					'a[href*="amazon.co.jp"][href*="/dp/B0CBR9GYF6"]'
				) as HTMLAnchorElement;
				expect(linkElement).toBeInTheDocument();
				expect(linkElement).toHaveAttribute("target", "_blank");
				expect(linkElement).toHaveAttribute(
					"rel",
					"noopener noreferrer sponsored"
				);

				// AmazonProductCardが表示されていることを確認（not-proseクラスを持つ）
				expect(linkElement).toHaveClass("not-prose");
			},
			{ timeout: 10000 }
		);
	},
};

/**
 * Amazon商品カード（短縮URL）
 */
export const AmazonProductCardShortUrlTest: Story = {
	name: "Amazon商品カード（短縮URL）",
	tags: ["validation"],
	args: {
		content: `# Amazon商品の紹介（短縮URL）

以下はAmazonの短縮URLです。

<https://amzn.to/43mMbSS>

短縮URLでもカード形式で表示されます。`,
		language: "ja",
	},
	parameters: {
		msw: {
			handlers: [
				// NextAuthのセッションをモック（空のセッション）
				http.get("/api/auth/session", () => {
					return HttpResponse.json({});
				}),
				http.get("http://localhost:8888/api/ogp", ({ request }) => {
					const url = new URL(request.url);
					const targetUrl = url.searchParams.get("url");

					if (targetUrl === "https://amzn.to/43mMbSS") {
						return HttpResponse.json({
							data: {
								title: "Amazon商品",
								description: "短縮URLから取得した商品情報",
								image: "https://m.media-amazon.com/images/I/sample-short.jpg",
								favicon: "https://www.amazon.co.jp/favicon.ico",
								siteName: "Amazon.co.jp",
								url: targetUrl,
							},
						});
					}

					return HttpResponse.json({ error: "Not found" }, { status: 404 });
				}),
			],
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// AmazonProductCardコンポーネントのレンダリングを待つ
		await waitFor(
			() => {
				// リンク要素の確認
				const linkElement = canvasElement.querySelector(
					'a[href="https://amzn.to/43mMbSS"]'
				) as HTMLAnchorElement;
				expect(linkElement).toBeInTheDocument();
				expect(linkElement).toHaveAttribute("target", "_blank");
				expect(linkElement).toHaveAttribute(
					"rel",
					"noopener noreferrer sponsored"
				);

				// AmazonProductCardが表示されていることを確認（not-proseクラスを持つ）
				expect(linkElement).toHaveClass("not-prose");
			},
			{ timeout: 10000 }
		);
	},
};

/**
 * Amazon商品カードの埋め込み（テキストと混在）
 */
export const AmazonProductCardWithText: Story = {
	name: "Amazon商品カードの埋め込み（テキストと混在）",
	tags: ["validation"],
	args: {
		content: `# Amazon商品カードとテキストの混在

Amazon商品カードの埋め込みは単独行のURLのみが対象です。

通常のテキスト内の[Amazonリンク](https://www.amazon.co.jp/dp/B08N5WRWNW)は埋め込まれず、通常のリンクとして表示されます。

https://www.amazon.co.jp/dp/B0CX23V2ZK

上記のように単独行のAmazon URLのみが商品カードとして埋め込まれます。`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 通常のリンクが存在することを確認
		const link = canvas.getByRole("link", { name: /Amazonリンク/ });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute(
			"href",
			"https://www.amazon.co.jp/dp/B08N5WRWNW"
		);

		// test-storybook環境ではAmazonProductCardコンポーネントが動的インポートで
		// 正しく動作しないため、Amazon商品カード自体のテストはスキップ
		// 実際のブラウザでの動作確認が必要
	},
};

/**
 * Amazon商品カードの埋め込み（短縮URL）
 */
export const AmazonProductCardShortUrl: Story = {
	name: "Amazon商品カードの埋め込み（短縮URL）",
	tags: ["validation"],
	args: {
		content: `# Amazon短縮URLの埋め込み

Amazonの短縮URL（amzn.to、amzn.asia）にも対応しています。

https://amzn.to/3ABC123

https://amzn.asia/d/xyz789

短縮URLの場合、ASINが直接取得できないため、「Amazon商品（短縮URL）」と表示されます。`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// test-storybook環境ではAmazonProductCardコンポーネントが動的インポートで
		// 正しく動作しないため、Amazon商品カード自体のテストはスキップ
		// 実際のブラウザでの動作確認が必要

		// 短縮URLがテキストとして表示されていることだけ確認
		const text = canvasElement.textContent;
		expect(text).toContain("amzn.to");
		expect(text).toContain("amzn.asia");
	},
};

/**
 * 楽天商品カード（通常URL・OGP表示）
 */
export const RakutenProductCardOgpDisplay: Story = {
	name: "楽天商品カード（通常URL・OGP表示）",
	tags: ["validation"],
	args: {
		content: `# 楽天商品の紹介

以下は楽天商品のリンクです。

<https://hb.afl.rakuten.co.jp/ichiba/4e068e00.5f53c806.4e068e01.d8b0cd27/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbook%2F17569477%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjEyOHgxMjgiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9>

OGP情報が取得されてカード形式で表示されます。`,
		language: "ja",
	},
	parameters: {
		msw: {
			handlers: [
				// NextAuthのセッションをモック（空のセッション）
				http.get("/api/auth/session", () => {
					return HttpResponse.json({});
				}),
				http.get("http://localhost:8888/api/ogp", ({ request }) => {
					const url = new URL(request.url);
					const targetUrl = url.searchParams.get("url");

					// 楽天URLにマッチ
					if (
						targetUrl?.includes("hb.afl.rakuten.co.jp") ||
						targetUrl?.includes("item.rakuten.co.jp")
					) {
						return HttpResponse.json({
							data: {
								title: "楽天商品のタイトル",
								description: "楽天商品の説明文です。",
								image: "https://via.placeholder.com/300",
								favicon: "https://www.rakuten.co.jp/favicon.ico",
								siteName: "楽天市場",
								url: targetUrl,
							},
						});
					}

					return HttpResponse.json({ error: "Not found" }, { status: 404 });
				}),
			],
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// RakutenProductCardコンポーネントのレンダリングを待つ
		await waitFor(
			() => {
				// リンク要素の確認
				const linkElement = canvasElement.querySelector(
					'a[href*="rakuten.co.jp"]'
				) as HTMLAnchorElement;
				expect(linkElement).toBeInTheDocument();
				expect(linkElement).toHaveAttribute("target", "_blank");
				expect(linkElement).toHaveAttribute(
					"rel",
					"noopener noreferrer sponsored"
				);

				// RakutenProductCardが表示されていることを確認（not-proseクラスを持つ）
				expect(linkElement).toHaveClass("not-prose");
			},
			{ timeout: 10000 }
		);
	},
};

/**
 * 楽天商品カード（短縮URL）
 */
export const RakutenProductCardShortUrlTest: Story = {
	name: "楽天商品カード（短縮URL）",
	tags: ["validation"],
	args: {
		content: `# 楽天商品の紹介（短縮URL）

以下は楽天の短縮URLです。

<https://a.r10.to/hF6JlM>

短縮URLでもカード形式で表示されます。`,
		language: "ja",
	},
	parameters: {
		msw: {
			handlers: [
				// NextAuthのセッションをモック（空のセッション）
				http.get("/api/auth/session", () => {
					return HttpResponse.json({});
				}),
				http.get("http://localhost:8888/api/ogp", ({ request }) => {
					const url = new URL(request.url);
					const targetUrl = url.searchParams.get("url");

					if (targetUrl === "https://a.r10.to/hF6JlM") {
						return HttpResponse.json({
							data: {
								title: "楽天商品",
								description: "短縮URLから取得した商品情報",
								image: "https://via.placeholder.com/300",
								favicon: "https://www.rakuten.co.jp/favicon.ico",
								siteName: "楽天市場",
								url: targetUrl,
							},
						});
					}

					return HttpResponse.json({ error: "Not found" }, { status: 404 });
				}),
			],
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// RakutenProductCardコンポーネントのレンダリングを待つ
		await waitFor(
			() => {
				// リンク要素の確認
				const linkElement = canvasElement.querySelector(
					'a[href="https://a.r10.to/hF6JlM"]'
				) as HTMLAnchorElement;
				expect(linkElement).toBeInTheDocument();
				expect(linkElement).toHaveAttribute("target", "_blank");
				expect(linkElement).toHaveAttribute(
					"rel",
					"noopener noreferrer sponsored"
				);

				// RakutenProductCardが表示されていることを確認（not-proseクラスを持つ）
				expect(linkElement).toHaveClass("not-prose");
			},
			{ timeout: 10000 }
		);
	},
};

/**
 * 通常URLカードの埋め込み（単独URL）
 */
export const UrlCardSingle: Story = {
	name: "通常URLカード（単独URL）",
	tags: ["validation"],
	args: {
		content: `# 通常URLの埋め込み

以下は通常のURLです。

https://ja.wikipedia.org/wiki/%E6%AD%A6%E8%80%85%E5%B0%8F%E8%B7%AF%E5%AE%9F%E7%AF%A4

URLカードとして表示されます。`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// URLCardコンポーネントのレンダリングとOGP情報の取得を待つ
		await waitFor(
			() => {
				// リンク要素の確認
				const linkElement = canvasElement.querySelector(
					'a[href="https://ja.wikipedia.org/wiki/%E6%AD%A6%E8%80%85%E5%B0%8F%E8%B7%AF%E5%AE%9F%E7%AF%A4"]'
				) as HTMLAnchorElement;
				expect(linkElement).toBeInTheDocument();
				expect(linkElement).toHaveAttribute("target", "_blank");
				expect(linkElement).toHaveAttribute("rel", "noopener noreferrer");

				// URLCardが表示されていることを確認（not-proseクラスを持つ）
				expect(linkElement).toHaveClass("not-prose");

				// OGP情報が表示されていることを確認
				// タイトル、説明、またはドメイン情報のいずれかが表示されている
				const hasContent =
					linkElement.textContent && linkElement.textContent.trim().length > 0;
				expect(hasContent).toBe(true);
			},
			{ timeout: 10000 }
		);
	},
};

/**
 * 通常URLカードの埋め込み（複数URL・改行1つ）
 */
export const UrlCardMultipleSingleNewline: Story = {
	name: "通常URLカード（複数URL・改行1つ）",
	tags: ["validation"],
	args: {
		content: `# 複数のURLの埋め込み（改行1つ）

以下は改行1つで区切られた2つのURLです。

https://ja.wikipedia.org/wiki/%E6%AD%A6%E8%80%85%E5%B0%8F%E8%B7%AF%E5%AE%9F%E7%AF%A4
https://www.mushakoji.org/

それぞれ独立したURLカードとして表示されます。`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// URLCardコンポーネントのレンダリングとOGP情報の取得を待つ
		await waitFor(
			() => {
				// 1つ目のリンク要素の確認
				const link1 = canvasElement.querySelector(
					'a[href="https://ja.wikipedia.org/wiki/%E6%AD%A6%E8%80%85%E5%B0%8F%E8%B7%AF%E5%AE%9F%E7%AF%A4"]'
				) as HTMLAnchorElement;
				expect(link1).toBeInTheDocument();
				expect(link1).toHaveAttribute("target", "_blank");
				expect(link1).toHaveAttribute("rel", "noopener noreferrer");
				expect(link1).toHaveClass("not-prose");

				// 2つ目のリンク要素の確認
				const link2 = canvasElement.querySelector(
					'a[href="https://www.mushakoji.org/"]'
				) as HTMLAnchorElement;
				expect(link2).toBeInTheDocument();
				expect(link2).toHaveAttribute("target", "_blank");
				expect(link2).toHaveAttribute("rel", "noopener noreferrer");
				expect(link2).toHaveClass("not-prose");

				// 両方のURLCardにOGP情報またはドメイン情報が表示されていることを確認
				const hasContent1 =
					link1.textContent && link1.textContent.trim().length > 0;
				const hasContent2 =
					link2.textContent && link2.textContent.trim().length > 0;
				expect(hasContent1).toBe(true);
				expect(hasContent2).toBe(true);
			},
			{ timeout: 10000 }
		);
	},
};

/**
 * Alert機能のテスト（GitHub互換）
 */
export const AlertsBasic: Story = {
	name: "Alert機能（基本）",
	tags: ["validation"],
	args: {
		content: `# Alert機能の例

## NOTE（デフォルト）

> [!NOTE]
> これは通常のメモなのだ。

## INFO（青色）

> [!INFO]
> これは情報メッセージなのだ。

## SUCCESS（緑色）

> [!SUCCESS]
> これは成功メッセージなのだ。

## WARNING（黄色）

> [!WARNING]
> これは警告メッセージなのだ。

## DANGER（赤色）

> [!DANGER]
> これは危険メッセージなのだ。`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// Alertコンポーネントが5つレンダリングされることを確認
		await waitFor(
			() => {
				const alerts = canvasElement.querySelectorAll('[data-slot="alert"]');
				expect(alerts.length).toBe(5);
			},
			{ timeout: 5000 }
		);
	},
};

/**
 * Alert機能のテスト（タイトル付き）
 */
export const AlertsWithTitle: Story = {
	name: "Alert機能（タイトル付き）",
	tags: ["validation"],
	args: {
		content: `# タイトル付きAlertの例

> [!NOTE] 重要なお知らせ
> こちらは通常のメモですが、タイトルが付いているのだ。

> [!INFO] 追加情報
> こちらは情報メッセージで、タイトルも表示されるのだ。

> [!WARNING] 注意が必要
> こちらは警告メッセージなのだ。タイトルで内容を要約しているのだ。`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// タイトルが表示されていることを確認
		await waitFor(
			() => {
				const title1 = canvas.getByText("重要なお知らせ");
				expect(title1).toBeInTheDocument();

				const title2 = canvas.getByText("追加情報");
				expect(title2).toBeInTheDocument();

				const title3 = canvas.getByText("注意が必要");
				expect(title3).toBeInTheDocument();
			},
			{ timeout: 5000 }
		);
	},
};

/**
 * Alert機能のテスト（複数段落）
 */
export const AlertsMultipleParagraphs: Story = {
	name: "Alert機能（複数段落）",
	tags: ["code-only"],
	args: {
		content: `# 複数段落のAlert

> [!INFO] 詳細な説明
> 最初の段落なのだ。
>
> 2番目の段落なのだ。
>
> 3番目の段落も含めることができるのだ。`,
		language: "ja",
	},
	parameters: {},
};

/**
 * Alert機能のテスト（通常のblockquoteと混在）
 */
export const AlertsWithBlockquote: Story = {
	name: "Alert機能（通常のblockquoteと混在）",
	tags: ["validation"],
	args: {
		content: `# AlertとBlockquoteの混在

## 通常のBlockquote

> これは通常の引用なのだ。
> [!TYPE] パターンがないため、Alertではなく通常のblockquoteとして扱われるのだ。

## Alert

> [!SUCCESS]
> これはSuccessのAlertなのだ。

## また通常のBlockquote

> もう一つの引用なのだ。`,
		language: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// Alertコンポーネントが1つのみレンダリングされることを確認
		await waitFor(
			() => {
				const alerts = canvasElement.querySelectorAll('[data-slot="alert"]');
				expect(alerts.length).toBe(1);

				// blockquoteが2つあることを確認
				const blockquotes = canvasElement.querySelectorAll("blockquote");
				expect(blockquotes.length).toBe(2);
			},
			{ timeout: 5000 }
		);
	},
};
