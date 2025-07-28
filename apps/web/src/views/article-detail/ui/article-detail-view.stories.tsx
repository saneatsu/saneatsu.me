import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, within } from "@storybook/test";
import type { Article } from "../../../shared";
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
	tags: [
		{ id: 1, slug: "react", name: "React" },
		{ id: 2, slug: "javascript", name: "JavaScript" },
		{ id: 3, slug: "frontend", name: "フロントエンド" },
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
export const 基本表示: Story = {
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
export const 記事ヘッダーテスト: Story = {
	name: "記事ヘッダーテスト",
	tags: ["validation"],
	args: {
		article: mockArticle,
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// タイトルの確認
		const title = canvas.getByRole("heading", { level: 1 });
		expect(title).toBeInTheDocument();
		expect(title).toHaveTextContent("React Hooksの完全ガイド");

		// 公開日の確認
		const publishedDate = canvas.getByText(/公開日:/);
		expect(publishedDate).toBeInTheDocument();

		// ステータスバッジの確認
		const statusBadge = canvas.getByText("公開");
		expect(statusBadge).toBeInTheDocument();

		// time要素の確認
		const timeElement = canvas.getByRole("time");
		expect(timeElement).toBeInTheDocument();
		expect(timeElement).toHaveAttribute("dateTime", "2024-01-15T10:00:00Z");
	},
};

/**
 * 英語ロケールでのテスト
 */
export const 英語ロケールテスト: Story = {
	name: "英語ロケールテスト",
	tags: ["validation"],
	args: {
		article: mockArticle,
		locale: "en",
	},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// 英語での公開日表示確認
		const publishedDate = canvas.getByText(/Published:/);
		expect(publishedDate).toBeInTheDocument();
		expect(publishedDate).toHaveTextContent("Published: January 15, 2024");

		// 英語でのステータスバッジ確認
		const statusBadge = canvas.getByText("Published");
		expect(statusBadge).toBeInTheDocument();

		// 戻るリンクの英語表示確認
		const backLink = canvas.getByRole("link", { name: /Back to/ });
		expect(backLink).toBeInTheDocument();
	},
};

/**
 * 下書き記事のテスト
 */
export const 下書き記事テスト: Story = {
	name: "下書き記事テスト",
	tags: ["validation"],
	args: {
		article: draftArticle,
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// 下書きステータスバッジの確認
		const draftBadge = canvas.getByText("下書き");
		expect(draftBadge).toBeInTheDocument();

		// 公開日が表示されないことを確認（publishedAtがnull）
		const publishedDate = canvas.queryByText(/公開日:/);
		expect(publishedDate).not.toBeInTheDocument();
	},
};

/**
 * Markdownレンダリングのテスト
 */
export const Markdownレンダリングテスト: Story = {
	name: "Markdownレンダリングテスト",
	tags: ["validation"],
	args: {
		article: markdownArticle,
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: any) => {
		const canvas = within(canvasElement);

		// 見出しの確認
		const h1 = canvas.getByRole("heading", { level: 2, name: "見出し1" }); // React Markdownでh1→h2になる
		expect(h1).toBeInTheDocument();

		const h2 = canvas.getByRole("heading", { level: 3, name: "見出し2" }); // React Markdownでh2→h3になる
		expect(h2).toBeInTheDocument();

		// リストの確認
		const list = canvas.getByRole("list");
		expect(list).toBeInTheDocument();

		// コードブロックの確認
		const codeBlock = canvas.getByText(/interface User/);
		expect(codeBlock).toBeInTheDocument();

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
export const セマンティック構造確認: Story = {
	name: "セマンティック構造確認",
	tags: ["validation"],
	args: {
		article: mockArticle,
		locale: "ja",
	},
	parameters: {},
	play: async ({ canvasElement }: any) => {
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
export const モバイル表示: Story = {
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
export const 長いコンテンツ: Story = {
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
