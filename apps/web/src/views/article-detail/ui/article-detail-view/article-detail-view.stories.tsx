import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "storybook/test";

import type { Article } from "@/shared";

import { ArticleDetailView } from "./article-detail-view";

const meta: Meta<typeof ArticleDetailView> = {
	component: ArticleDetailView,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// テスト用のモック記事データ
const mockArticle: Article = {
	id: 1,
	slug: "react-hooks-guide",
	cfImageId: null,
	status: "published",
	publishedAt: "2024-01-15T10:00:00Z",
	updatedAt: "2024-01-20T15:30:00Z",
	title: "React Hooksの完全ガイド",
	content: `# React Hooksとは

React Hooksは、関数コンポーネントで状態管理や副作用を扱うための機能です。

## 基本的なHooks

### useState

\`useState\`は最も基本的なHookです。

\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

### useEffect

副作用を扱うためのHookです：

\`\`\`javascript
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

## 利点

1. **シンプルな構文**: クラスコンポーネントより簡潔
2. **再利用性**: カスタムHookで機能を分離
3. **テスト容易性**: 純粋関数として扱える

> Hooksを使うことで、コンポーネントの可読性が大幅に向上します。

## まとめ

React Hooksを使って、より良いReactアプリケーションを構築しましょう！`,
	viewCount: 127,
	tags: [
		{
			id: 1,
			slug: "react",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			articleCount: 0,
			translations: { ja: "React", en: "React" },
		},
		{
			id: 2,
			slug: "typescript",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			articleCount: 0,
			translations: { ja: "TypeScript", en: "TypeScript" },
		},
		{
			id: 3,
			slug: "hooks",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			articleCount: 0,
			translations: { ja: "フック", en: "Hooks" },
		},
	],
};

const draftArticle: Article = {
	...mockArticle,
	id: 2,
	slug: "draft-article",
	status: "draft",
	publishedAt: null,
	title: "下書き記事のテスト",
	content: "この記事は下書きです。",
};

const markdownArticle: Article = {
	...mockArticle,
	id: 3,
	slug: "markdown-test",
	title: "Markdownテスト記事",
	content: `# 見出し1

## 見出し2

### 見出し3

**太字**テキストと *斜体* テキスト。

- リスト項目1
- リスト項目2
  - ネストされた項目

1. 順序付きリスト1
2. 順序付きリスト2

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

> これはブロッククォートです。
> 複数行にわたって書くことができます。

インライン\`code\`もサポートしています。`,
};

/**
 * 基本的な表示確認用のStory
 */
export const Default: Story = {
	name: "基本表示",
	tags: ["code-only"],
	args: {
		article: mockArticle,
		locale: "ja",
	},
	parameters: {},
};

/**
 * 記事ヘッダーのテスト
 */
export const ArticleHeaderTest: Story = {
	name: "記事ヘッダーテスト",
	tags: ["validation"],
	args: {
		article: mockArticle,
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// タイトルの確認（記事タイトルのh1を直接テキストで検索）
		const title = canvas.getByRole("heading", {
			level: 1,
			name: "React Hooksの完全ガイド",
		});
		expect(title).toBeInTheDocument();

		// 公開日の確認
		const publishedDate = canvas.getByText(/公開日:/);
		expect(publishedDate).toBeInTheDocument();

		// time要素の確認（複数あるので、datetime属性で絞り込む）
		const timeElements = canvas.getAllByRole("time");
		expect(timeElements.length).toBeGreaterThanOrEqual(1);

		// 公開日のtime要素を確認
		const publishedTimeElement = timeElements.find(
			(el) => el.getAttribute("datetime") === "2024-01-15T10:00:00Z"
		);
		expect(publishedTimeElement).toBeDefined();
	},
};

/**
 * タグ表示のテスト
 */
export const TagsDisplayTest: Story = {
	name: "タグ表示テスト",
	tags: ["code-only"],
	args: {
		article: mockArticle,
		locale: "ja",
	},
	parameters: {},
};

/**
 * タグなし記事のテスト
 */
export const NoTagsArticleTest: Story = {
	name: "タグなし記事",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			tags: [],
		},
		locale: "ja",
	},
	parameters: {},
};

/**
 * 英語ロケールでのテスト
 */
export const EnglishLocaleTest: Story = {
	name: "英語ロケールテスト",
	tags: ["validation"],
	args: {
		article: mockArticle,
		locale: "en",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 英語での記事タイトル表示確認
		const title = canvas.getByRole("heading", {
			level: 1,
			name: "React Hooksの完全ガイド",
		});
		expect(title).toBeInTheDocument();

		// 英語での公開日表示確認（time要素の存在を確認）
		const timeElements = canvas.getAllByRole("time");
		expect(timeElements.length).toBeGreaterThanOrEqual(1);
	},
};

/**
 * 下書き記事のテスト
 */
export const DraftArticleTest: Story = {
	name: "下書き記事",
	tags: ["validation"],
	args: {
		article: draftArticle,
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// タイトルが表示されることを確認
		const title = canvas.getByRole("heading", {
			level: 1,
			name: "下書き記事のテスト",
		});
		expect(title).toBeInTheDocument();

		// 公開日が表示されないことを確認（publishedAtがnull）
		const timeElements = canvas.queryAllByRole("time");
		// publishedAtがnullなので、time要素は更新日のみ（1つ以下）
		expect(timeElements.length).toBeLessThanOrEqual(1);
	},
};

/**
 * Markdownレンダリングのテスト
 */
export const MarkdownRenderingTest: Story = {
	name: "Markdownレンダリング",
	tags: ["validation"],
	args: {
		article: markdownArticle,
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 見出しの確認（複数のh1があるのでgetAllByRoleを使用）
		const headings = canvas.getAllByRole("heading", { level: 1 });
		const h1 = headings.find((h) => h.textContent === "見出し1");
		expect(h1).toBeDefined();

		// h2見出しの確認
		const h2 = canvas.getByRole("heading", { level: 2, name: "見出し2" });
		expect(h2).toBeInTheDocument();

		// リストの確認（複数のリストがあるのでgetAllByRoleを使用）
		const lists = canvas.getAllByRole("list");
		expect(lists.length).toBeGreaterThanOrEqual(1);

		// コードブロックの確認（pre要素の存在を確認）
		const codeBlocks = canvasElement.querySelectorAll("pre");
		expect(codeBlocks.length).toBeGreaterThanOrEqual(1);

		// インラインコードの確認
		const inlineCode = canvas.getByText("code");
		expect(inlineCode).toBeInTheDocument();

		// ブロッククォートの確認
		const blockquote = canvas.getByText(/これはブロッククォート/);
		expect(blockquote).toBeInTheDocument();
	},
};

/**
 * セマンティック構造の確認
 */
export const SemanticStructureCheck: Story = {
	name: "セマンティック構造",
	tags: ["validation"],
	args: {
		article: mockArticle,
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// main要素の確認
		const main = canvas.getByRole("main");
		expect(main).toBeInTheDocument();

		// article要素の確認
		const article = canvas.getByRole("article");
		expect(article).toBeInTheDocument();

		// header, footer要素の確認
		const header = canvasElement.querySelector("header");
		const footer = canvasElement.querySelector("footer");

		expect(header).toBeInTheDocument();
		expect(footer).toBeInTheDocument();

		// 戻るリンクの確認
		const backLink = canvas.getByRole("link");
		expect(backLink).toBeInTheDocument();
		expect(backLink).toHaveAttribute("href", "/ja");
	},
};

/**
 * レスポンシブ表示の確認
 */
export const MobileView: Story = {
	name: "モバイル表示",
	tags: ["code-only"],
	args: {
		article: mockArticle,
		locale: "ja",
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

/**
 * 長いコンテンツでの表示確認
 */
export const LongContent: Story = {
	name: "長いコンテンツ",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			content: Array(10).fill(mockArticle.content).join("\n\n"),
		},
		locale: "ja",
	},
	parameters: {},
};

/**
 * 更新日が今日の場合のテスト
 */
export const UpdatedToday: Story = {
	name: "更新日が今日",
	tags: ["validation"],
	args: {
		article: {
			...mockArticle,
			updatedAt: new Date().toISOString(),
		},
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 公開日の確認
		const publishedDate = canvas.getByText(/公開日:/);
		expect(publishedDate).toBeInTheDocument();

		// 更新日の確認
		const updatedDate = canvas.getByText(/更新日:/);
		expect(updatedDate).toBeInTheDocument();

		// 「今日」が表示されていることを確認
		const todayText = canvas.getByText(/今日/);
		expect(todayText).toBeInTheDocument();
	},
};

/**
 * 更新日が5日前の場合のテスト
 */
export const Updated5DaysAgo: Story = {
	name: "更新日が5日前",
	tags: ["validation"],
	args: {
		article: {
			...mockArticle,
			updatedAt: (() => {
				const date = new Date();
				date.setDate(date.getDate() - 5);
				return date.toISOString();
			})(),
		},
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 更新日の確認
		const updatedDate = canvas.getByText(/更新日:/);
		expect(updatedDate).toBeInTheDocument();

		// 「5日前」が表示されていることを確認
		const daysAgoText = canvas.getByText(/5日前/);
		expect(daysAgoText).toBeInTheDocument();
	},
};

/**
 * 更新日が10日前の場合のテスト（境界値）
 */
export const Updated10DaysAgo: Story = {
	name: "更新日が10日前（境界値）",
	tags: ["validation"],
	args: {
		article: {
			...mockArticle,
			updatedAt: (() => {
				const date = new Date();
				date.setDate(date.getDate() - 10);
				return date.toISOString();
			})(),
		},
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 更新日の確認
		const updatedDate = canvas.getByText(/更新日:/);
		expect(updatedDate).toBeInTheDocument();

		// 「10日前」が表示されていることを確認
		const daysAgoText = canvas.getByText(/10日前/);
		expect(daysAgoText).toBeInTheDocument();
	},
};

/**
 * 更新日が15日前の場合のテスト（通常の日付形式）
 */
export const Updated15DaysAgo: Story = {
	name: "更新日が15日前（通常の日付形式）",
	tags: ["validation"],
	args: {
		article: {
			...mockArticle,
			updatedAt: "2024-01-01T10:00:00.000Z",
		},
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 更新日の確認
		const updatedDate = canvas.getByText(/更新日:/);
		expect(updatedDate).toBeInTheDocument();

		// 通常の日付形式で表示されていることを確認（相対表示ではない）
		const timeElements = canvasElement.querySelectorAll("time");
		const updatedTimeElement = Array.from(timeElements).find((el) =>
			el.textContent?.includes("更新日:")
		);
		expect(updatedTimeElement).toBeDefined();

		// 「日前」が含まれていないことを確認
		const hasRelativeFormat = updatedTimeElement?.textContent?.includes("日前");
		expect(hasRelativeFormat).toBe(false);
	},
};

/**
 * 更新日がnullの場合のテスト
 */
export const UpdatedAtNull: Story = {
	name: "更新日がnull",
	tags: ["validation"],
	args: {
		article: {
			...mockArticle,
			updatedAt: null,
		},
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// 公開日は表示されていることを確認
		const publishedDate = canvas.getByText(/公開日:/);
		expect(publishedDate).toBeInTheDocument();

		// 更新日は表示されていないことを確認
		const updatedDates = canvas.queryAllByText(/更新日:/);
		expect(updatedDates.length).toBe(0);
	},
};

/**
 * 長いタイトル（100文字以上）のテスト
 */
export const LongTitle: Story = {
	name: "長いタイトル（100文字以上）",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			title:
				"React Hooksを使った状態管理とuseEffect、useContext、useReducerなどのフックを組み合わせた複雑なアプリケーション設計パターンとベストプラクティスについての完全ガイド",
		},
		locale: "ja",
	},
	parameters: {},
};

/**
 * 特殊文字を含むタイトルのテスト
 */
export const TitleWithSpecialCharacters: Story = {
	name: "特殊文字を含むタイトル（絵文字・記号）",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			title: "🚀 React Hooks 🎯 完全ガイド！【TypeScript対応版】<超重要>",
		},
		locale: "ja",
	},
	parameters: {},
};

/**
 * Wiki Linkを含むコンテンツのテスト
 */
export const ContentWithWikiLinks: Story = {
	name: "Wiki Linkを含むコンテンツ",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			title: "React HooksとTypeScriptの基礎",
			content: `# React Hooksの概要

React Hooksについてより詳しく知りたい場合は、[[typescript-basics]] の記事を参照してください。

## useStateの詳細

useStateの使い方については [[react-hooks-guide#useState]] を確認してください。

## 関連記事

- [[next-js-guide]] - Next.jsとReact Hooksの組み合わせ
- [[custom-hooks-patterns]] - カスタムフックのパターン集
- [[state-management#context-api]] - Context APIを使った状態管理

詳細は [[react-hooks-guide]] を参照してください。`,
		},
		locale: "ja",
	},
	parameters: {},
};

/**
 * 画像を含むコンテンツのテスト
 */
export const ContentWithImages: Story = {
	name: "画像を含むコンテンツ",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			title: "React Hooksのビジュアルガイド",
			content: `# React Hooksの図解

## useStateの仕組み

以下の図は、useStateの内部動作を示しています。

![useStateの仕組み](https://example.com/images/usestate-diagram.png)

## useEffectのライフサイクル

useEffectは以下のタイミングで実行されます：

![useEffectのライフサイクル](https://example.com/images/useeffect-lifecycle.png)

## カスタムフックの例

![カスタムフックの実装例](https://example.com/images/custom-hooks-example.png)

これらの図を参考に、React Hooksの理解を深めましょう。`,
		},
		locale: "ja",
	},
	parameters: {},
};

/**
 * 複雑なMarkdown構造のテスト
 */
export const ComplexMarkdownStructure: Story = {
	name: "複雑なMarkdown構造（ネストリスト・表）",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			title: "高度なMarkdown記法のテスト",
			content: `# 複雑なMarkdown構造

## ネストされたリスト

- トップレベル項目1
  - ネストレベル1-1
    - ネストレベル1-1-1
      - ネストレベル1-1-1-1
    - ネストレベル1-1-2
  - ネストレベル1-2
- トップレベル項目2
  - ネストレベル2-1
    - 深くネストされた項目
      - さらに深い項目

## 複雑な表

| Hook名 | 用途 | 引数 | 戻り値 | 使用例 |
|--------|------|------|--------|--------|
| useState | 状態管理 | 初期値 | [state, setState] | \`const [count, setCount] = useState(0)\` |
| useEffect | 副作用処理 | コールバック, 依存配列 | cleanup関数 | \`useEffect(() => {...}, [])\` |
| useContext | Context取得 | Context | Context値 | \`const value = useContext(MyContext)\` |
| useReducer | 複雑な状態管理 | reducer, 初期値 | [state, dispatch] | \`const [state, dispatch] = useReducer(reducer, init)\` |
| useMemo | メモ化 | 関数, 依存配列 | メモ化された値 | \`const value = useMemo(() => compute(), [dep])\` |

## ブロッククォート内のネストリスト

> ### 重要なポイント
>
> Hooksを使用する際は以下に注意してください：
>
> 1. ルールを守る
>    - トップレベルでのみ呼び出す
>    - React関数内でのみ使用
> 2. 依存配列を正しく設定
>    - すべての依存値を含める
>    - 依存値が変更されたときのみ再実行
> 3. カスタムフックを活用
>    - ロジックの再利用
>    - コンポーネントの簡素化

## コードブロックを含むリスト

1. Hooksのインポート

   \`\`\`typescript
   import { useState, useEffect, useContext } from 'react';
   \`\`\`

2. useStateの使用

   \`\`\`typescript
   const [count, setCount] = useState(0);
   const increment = () => setCount(prev => prev + 1);
   \`\`\`

3. useEffectの使用

   \`\`\`typescript
   useEffect(() => {
     console.log('Count changed:', count);
     return () => console.log('Cleanup');
   }, [count]);
   \`\`\``,
		},
		locale: "ja",
	},
	parameters: {},
};

/**
 * 多数のタグ（10個以上）のテスト
 */
export const ManyTags: Story = {
	name: "多数のタグ（10個以上）",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			tags: [
				{
					id: 1,
					slug: "react",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					articleCount: 0,
					translations: { ja: "React", en: "React" },
				},
				{
					id: 2,
					slug: "typescript",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					articleCount: 0,
					translations: { ja: "TypeScript", en: "TypeScript" },
				},
				{
					id: 3,
					slug: "hooks",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					articleCount: 0,
					translations: { ja: "フック", en: "Hooks" },
				},
				{
					id: 4,
					slug: "frontend",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					articleCount: 0,
					translations: { ja: "フロントエンド", en: "Frontend" },
				},
				{
					id: 5,
					slug: "javascript",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					articleCount: 0,
					translations: { ja: "JavaScript", en: "JavaScript" },
				},
				{
					id: 6,
					slug: "web-development",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					articleCount: 0,
					translations: { ja: "Web開発", en: "Web Development" },
				},
				{
					id: 7,
					slug: "state-management",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					articleCount: 0,
					translations: { ja: "状態管理", en: "State Management" },
				},
				{
					id: 8,
					slug: "best-practices",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00:00Z",
					articleCount: 0,
					translations: { ja: "ベストプラクティス", en: "Best Practices" },
				},
				{
					id: 9,
					slug: "performance",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					articleCount: 0,
					translations: { ja: "パフォーマンス", en: "Performance" },
				},
				{
					id: 10,
					slug: "optimization",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					articleCount: 0,
					translations: { ja: "最適化", en: "Optimization" },
				},
				{
					id: 11,
					slug: "testing",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					articleCount: 0,
					translations: { ja: "テスト", en: "Testing" },
				},
				{
					id: 12,
					slug: "debugging",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					articleCount: 0,
					translations: { ja: "デバッグ", en: "Debugging" },
				},
			],
		},
		locale: "ja",
	},
	parameters: {},
};

/**
 * 閲覧数が非常に大きい記事のテスト
 */
export const VeryHighViewCount: Story = {
	name: "閲覧数が非常に大きい記事（10万以上）",
	tags: ["code-only"],
	args: {
		article: {
			...mockArticle,
			viewCount: 123456,
		},
		locale: "ja",
	},
	parameters: {},
};
