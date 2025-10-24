import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "@storybook/test";

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
export const 基本的なMarkdown要素: Story = {
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
export const コードブロック: Story = {
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
		const canvas = within(canvasElement);

		// TypeScriptコードブロックの確認
		const tsCode = canvas.getByText(/interface User/);
		expect(tsCode).toBeInTheDocument();

		// JavaScriptコードブロックの確認
		const jsCode = canvas.getByText(/const sum = /);
		expect(jsCode).toBeInTheDocument();

		// コードブロック要素の確認
		const codeBlocks = canvasElement.querySelectorAll("pre");
		expect(codeBlocks.length).toBeGreaterThanOrEqual(2);
	},
};

/**
 * インラインコードのテスト
 */
export const インラインコード: Story = {
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
export const ブロッククォート: Story = {
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
export const 表: Story = {
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
export const タグ: Story = {
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
export const GFM機能: Story = {
	name: "GFM機能（取り消し線・タスクリスト・自動リンク）",
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
export const 複雑なネスト構造: Story = {
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

		// ブロッククォート内のコードブロックの確認
		const nestedCode = canvas.getByText(/const example/);
		expect(nestedCode).toBeInTheDocument();

		// リスト内のコードブロックの確認
		const npmInstall = canvas.getAllByText("npm install");
		expect(npmInstall.length).toBeGreaterThan(0);
	},
};

/**
 * 空のコンテンツのテスト
 */
export const 空のコンテンツ: Story = {
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
export const ダークモード表示: Story = {
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
export const 英語ロケール: Story = {
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

		// Wiki Linkの確認（英語ロケール）
		const wikiLink = canvas.getByText("react-hooks-guide");
		expect(wikiLink).toBeInTheDocument();
	},
};
