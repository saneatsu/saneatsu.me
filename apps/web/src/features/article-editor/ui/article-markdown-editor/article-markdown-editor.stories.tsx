import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "@storybook/test";
import { useState } from "react";

import { ArticleMarkdownEditor } from "./article-markdown-editor";

const meta: Meta<typeof ArticleMarkdownEditor> = {
	component: ArticleMarkdownEditor,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// モックのsetValue関数
const mockSetValue = (name: string, value: string) => {
	console.log(`setValue called: ${name} = ${value}`);
};

/**
 * 基本表示（ライブモード）
 */
export const 基本表示: Story = {
	name: "基本表示（ライブモード）",
	tags: ["code-only"],
	args: {},
	parameters: {},
	render: () => {
		const [value, setValue] = useState(`# Welcome to Markdown Editor

## 基本的な使い方

このエディタでは以下の機能が使用できます：

- **太字**と*斜体*
- \`インラインコード\`
- リスト
- コードブロック

### コードブロックの例

\`\`\`typescript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

### Wiki Linkの例

[[react-hooks-guide]] のような記法で他の記事にリンクできます。

### タグの例

#React #TypeScript #Markdown`);

		return (
			<ArticleMarkdownEditor
				value={value}
				onChange={setValue}
				setValue={mockSetValue}
				language="ja"
			/>
		);
	},
};

/**
 * プレビューモード
 */
export const プレビューモード: Story = {
	name: "プレビューモード（プレビューのみ）",
	tags: ["code-only"],
	args: {},
	parameters: {},
	render: () => {
		const [value] = useState(`# プレビューモード

このモードでは編集エリアが非表示になり、プレビューのみが表示されます。

## 機能

- **レンダリング結果**のみを確認できます
- **編集はできません**

## Wiki Link

[[typescript-basics]]

## タグ

#Preview #Mode`);

		return (
			<ArticleMarkdownEditor
				value={value}
				onChange={() => {}}
				setValue={mockSetValue}
				preview="preview"
				language="ja"
			/>
		);
	},
};

/**
 * 編集モード
 */
export const 編集モード: Story = {
	name: "編集モード（エディタのみ）",
	tags: ["code-only"],
	args: {},
	parameters: {},
	render: () => {
		const [value, setValue] = useState(`# 編集モード

このモードでは編集エリアのみが表示されます。

プレビューは非表示です。`);

		return (
			<ArticleMarkdownEditor
				value={value}
				onChange={setValue}
				setValue={mockSetValue}
				preview="edit"
				language="ja"
			/>
		);
	},
};

/**
 * Wiki Linkのプレビュー
 */
export const WikiLinkのプレビュー: Story = {
	name: "Wiki Linkのプレビュー",
	tags: ["validation"],
	args: {},
	parameters: {},
	render: () => {
		const [value] = useState(`# Wiki Linkの使い方

## 基本的なWiki Link

記事へのリンク：[[react-hooks-guide]]

## 見出しへのリンク

特定の見出しへのリンク：[[react-hooks-guide#useState]]

## 複数のWiki Link

- [[typescript-basics]]
- [[next-js-guide]]
- [[git-commands#branch]]
- [[javascript-fundamentals#variables]]`);

		return (
			<ArticleMarkdownEditor
				value={value}
				onChange={() => {}}
				setValue={mockSetValue}
				language="ja"
			/>
		);
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// プレビューエリアのWiki Linkを確認
		const previewArea = canvasElement.querySelector(".wmde-markdown");
		if (previewArea) {
			const wikiLinks = previewArea.querySelectorAll('a[class*="wiki-link"]');
			expect(wikiLinks.length).toBeGreaterThanOrEqual(4);
		}
	},
};

/**
 * タグのプレビュー
 */
export const タグのプレビュー: Story = {
	name: "タグのプレビュー",
	tags: ["validation"],
	args: {},
	parameters: {},
	render: () => {
		const [value] = useState(`# タグの使い方

この記事には #React #TypeScript #Next.js のタグが付いています。

## 段落内のタグ

この機能は #experimental なので注意が必要です。

## リスト内のタグ

- #frontend
- #backend
- #fullstack
- #DevOps`);

		return (
			<ArticleMarkdownEditor
				value={value}
				onChange={() => {}}
				setValue={mockSetValue}
				language="ja"
			/>
		);
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const previewArea = canvasElement.querySelector(".wmde-markdown");
		if (previewArea) {
			// タグが表示されていることを確認
			const canvas = within(previewArea as HTMLElement);
			const reactTag = canvas.getByText("#React");
			expect(reactTag).toBeInTheDocument();

			const typescriptTag = canvas.getByText("#TypeScript");
			expect(typescriptTag).toBeInTheDocument();
		}
	},
};

/**
 * コードブロックのプレビュー
 */
export const コードブロックのプレビュー: Story = {
	name: "コードブロックのプレビュー",
	tags: ["validation"],
	args: {},
	parameters: {},
	render: () => {
		const [value] = useState(`# コードブロックの例

## TypeScript

\`\`\`typescript
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "John",
  age: 30
};
\`\`\`

## JavaScript

\`\`\`javascript
const sum = (a, b) => a + b;
console.log(sum(1, 2)); // 3
\`\`\`

## Bash

\`\`\`bash
npm install
npm start
\`\`\``);

		return (
			<ArticleMarkdownEditor
				value={value}
				onChange={() => {}}
				setValue={mockSetValue}
				language="ja"
			/>
		);
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const previewArea = canvasElement.querySelector(".wmde-markdown");
		if (previewArea) {
			// コードブロックの確認
			const codeBlocks = previewArea.querySelectorAll("pre");
			expect(codeBlocks.length).toBeGreaterThanOrEqual(3);

			// プレビューエリア全体のテキストにコードの一部が含まれているか確認
			const previewText = previewArea.textContent || "";
			expect(previewText).toContain("interface User");
			expect(previewText).toContain("const sum");
			expect(previewText).toContain("npm install");
		}
	},
};

/**
 * ダークモード表示
 */
export const ダークモード表示: Story = {
	name: "ダークモード表示",
	tags: ["code-only"],
	args: {},
	parameters: {
		backgrounds: { default: "dark" },
	},
	render: () => {
		const [value, setValue] = useState(`# ダークモード対応

## コードブロック

\`\`\`typescript
const darkMode = true;
console.log("Dark mode is enabled");
\`\`\`

## Wiki Link

[[dark-mode-guide]]

## タグ

#DarkMode #Theme`);

		return (
			<ArticleMarkdownEditor
				value={value}
				onChange={setValue}
				setValue={mockSetValue}
				language="ja"
			/>
		);
	},
};

/**
 * カスタム高さ指定
 */
export const カスタム高さ指定: Story = {
	name: "カスタム高さ指定（300px）",
	tags: ["code-only"],
	args: {},
	parameters: {},
	render: () => {
		const [value, setValue] = useState(`# カスタム高さ

エディタの高さを300pxに設定しています。

短いコンテンツでも、指定された高さで表示されます。`);

		return (
			<ArticleMarkdownEditor
				value={value}
				onChange={setValue}
				setValue={mockSetValue}
				height={300}
				language="ja"
			/>
		);
	},
};

/**
 * 長いコンテンツ
 */
export const 長いコンテンツ: Story = {
	name: "長いコンテンツ",
	tags: ["code-only"],
	args: {},
	parameters: {},
	render: () => {
		const [value, setValue] = useState(
			Array(20)
				.fill(
					`## セクション

これは長いコンテンツのテストです。スクロールが正しく動作することを確認します。

\`\`\`typescript
const example = "code block";
\`\`\`

- リスト項目1
- リスト項目2
- リスト項目3

[[wiki-link]] and #tag

`
				)
				.join("\n")
		);

		return (
			<ArticleMarkdownEditor
				value={value}
				onChange={setValue}
				setValue={mockSetValue}
				language="ja"
			/>
		);
	},
};

/**
 * 空の状態
 */
export const 空の状態: Story = {
	name: "空の状態",
	tags: ["validation"],
	args: {},
	parameters: {},
	render: () => {
		const [value, setValue] = useState("");

		return (
			<ArticleMarkdownEditor
				value={value}
				onChange={setValue}
				setValue={mockSetValue}
				language="ja"
			/>
		);
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// エディタが表示されていることを確認
		const editor = canvasElement.querySelector(".w-md-editor");
		expect(editor).toBeInTheDocument();

		// textareaが存在することを確認
		const textarea = canvasElement.querySelector("textarea");
		expect(textarea).toBeInTheDocument();
		expect(textarea?.value).toBe("");
	},
};

/**
 * 英語ロケール
 */
export const 英語ロケール: Story = {
	name: "英語ロケール",
	tags: ["code-only"],
	args: {},
	parameters: {},
	render: () => {
		const [value, setValue] = useState(`# English Content

## Wiki Link

Check out [[react-hooks-guide]] for more information.

## Tags

This article is tagged with #React #TypeScript #English

## Code

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\``);

		return (
			<ArticleMarkdownEditor
				value={value}
				onChange={setValue}
				setValue={mockSetValue}
				language="en"
			/>
		);
	},
};
