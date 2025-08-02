import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { HttpResponse, http } from "msw";
import React from "react";
import type { SuggestionItem } from "../../api/use-suggestions";
import { ArticleSuggestionsPopover } from "./article-suggestions-popover";

// モックデータ
const mockSuggestions: SuggestionItem[] = [
	{
		slug: "typescript-practice-106",
		title: "TypeScript実践テクニック 106",
		type: "article",
	},
	{
		slug: "typescript-practice-176",
		title: "TypeScript実践テクニック 176",
		type: "article",
	},
	{
		slug: "react-hooks-guide",
		title: "React Hooksの完全ガイド",
		type: "article",
	},
	{
		slug: "nextjs-performance-optimization",
		title: "実践的な例",
		type: "heading",
		headingLevel: 2,
		headingId: "practical-examples",
		articleTitle: "Next.jsパフォーマンス最適化",
	},
];

const meta: Meta<typeof ArticleSuggestionsPopover> = {
	component: ArticleSuggestionsPopover,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
		// React Queryのモックレスポンスを設定
		msw: {
			handlers: [
				// デフォルトのハンドラー - ワイルドカードパターンを使用
				http.get("*/api/articles/suggestions", () => {
					return HttpResponse.json({
						suggestions: mockSuggestions,
						fromCache: false,
					});
				}),
			],
		},
	},
	argTypes: {
		onSelect: { action: "selected" },
		onOpenChange: { action: "openChanged" },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 基本的な表示確認
 */
export const 基本表示: Story = {
	name: "基本表示",
	tags: ["code-only"],
	args: {
		open: true,
		query: "type",
		language: "ja",
		position: { top: 200, left: 100 },
		onSelect: fn(),
		onOpenChange: fn(),
	},
	parameters: {},
};

/**
 * 空の検索結果
 */
export const 検索結果なし: Story = {
	name: "検索結果なし",
	tags: ["code-only"],
	args: {
		open: true,
		query: "zzzzz",
		language: "ja",
		position: { top: 200, left: 100 },
		onSelect: fn(),
		onOpenChange: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("*/api/articles/suggestions", () => {
					return HttpResponse.json({
						suggestions: [],
						fromCache: false,
					});
				}),
			],
		},
	},
};

/**
 * キーボードナビゲーションのテスト
 */
export const キーボードナビゲーション: Story = {
	name: "キーボードナビゲーション",
	tags: ["validation"],
	args: {
		open: true,
		query: "type",
		language: "ja",
		position: { top: 200, left: 100 },
		onSelect: fn(),
		onOpenChange: fn(),
	},
	parameters: {},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// サジェストが表示されるまで待つ
		await waitFor(
			async () => {
				const firstItem = await canvas.findByText(
					"TypeScript実践テクニック 106"
				);
				expect(firstItem).toBeInTheDocument();
			},
			{ timeout: 5000 }
		);

		// コマンドアイテムを探す
		const commandItems = await canvas.findAllByRole("option");
		expect(commandItems).toHaveLength(4);

		// 最初のアイテムがハイライトされているか確認
		const firstItem = commandItems[0];
		expect(firstItem).toHaveAttribute("data-selected", "true");

		// Tabキーで次のアイテムへ移動
		await userEvent.keyboard("{Tab}");
		await waitFor(() => {
			expect(commandItems[1]).toHaveAttribute("data-selected", "true");
		});

		// Shift+Tabで前のアイテムへ戻る
		await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
		await waitFor(() => {
			expect(commandItems[0]).toHaveAttribute("data-selected", "true");
		});
	},
};

/**
 * ESCキーでの閉じる動作
 */
export const ESCキーで閉じる: Story = {
	name: "ESCキーで閉じる",
	tags: ["validation"],
	args: {
		open: true,
		query: "type",
		language: "ja",
		position: { top: 200, left: 100 },
		onSelect: fn(),
		onOpenChange: fn(),
	},
	parameters: {},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// サジェストが表示されるまで待つ
		await waitFor(
			async () => {
				const firstItem = await canvas.findByText(
					"TypeScript実践テクニック 106"
				);
				expect(firstItem).toBeInTheDocument();
			},
			{ timeout: 5000 }
		);

		// ESCキーを押す
		await userEvent.keyboard("{Escape}");

		// onOpenChangeが呼ばれたことを確認
		await waitFor(() => {
			expect(args.onOpenChange).toHaveBeenCalledWith(false);
		});
	},
};

/**
 * アイテム選択のテスト
 */
export const アイテム選択: Story = {
	name: "アイテム選択",
	tags: ["validation"],
	args: {
		open: true,
		query: "type",
		language: "ja",
		position: { top: 200, left: 100 },
		onSelect: fn(),
		onOpenChange: fn(),
	},
	parameters: {},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// サジェストが表示されるまで待つ
		await waitFor(
			async () => {
				const firstItem = await canvas.findByText(
					"TypeScript実践テクニック 106"
				);
				expect(firstItem).toBeInTheDocument();
			},
			{ timeout: 5000 }
		);

		// アイテムをクリック
		const itemToClick = await canvas.findByText("TypeScript実践テクニック 176");
		await userEvent.click(itemToClick);

		// onSelectが正しい引数で呼ばれたことを確認
		await waitFor(() => {
			expect(args.onSelect).toHaveBeenCalledWith({
				slug: "typescript-practice-176",
				title: "TypeScript実践テクニック 176",
				type: "article",
			});
		});
	},
};

/**
 * Enterキーでの選択（MDEditor内でのシミュレーション）
 */
export const Enterキーで選択: Story = {
	name: "Enterキーで選択",
	tags: ["validation"],
	args: {
		open: true,
		query: "type",
		language: "ja",
		position: { top: 200, left: 100 },
		onSelect: fn(),
		onOpenChange: fn(),
	},
	parameters: {},
	render: (args) => {
		// MDEditorのコンテキストをシミュレート
		return (
			<div className="w-md-editor">
				<textarea className="w-md-editor-text-input" defaultValue="[[type" />
				<ArticleSuggestionsPopover {...args} />
			</div>
		);
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// textareaにフォーカス
		const textarea = canvas.getByRole("textbox");
		await userEvent.click(textarea);

		// サジェストが表示されるまで待つ
		await waitFor(
			async () => {
				const firstItem = await canvas.findByText(
					"TypeScript実践テクニック 106"
				);
				expect(firstItem).toBeInTheDocument();
			},
			{ timeout: 5000 }
		);

		// Tabで2番目のアイテムへ移動
		await userEvent.keyboard("{Tab}");

		// Enterキーで選択
		await userEvent.keyboard("{Enter}");

		// onSelectが正しい引数で呼ばれたことを確認
		await waitFor(() => {
			expect(args.onSelect).toHaveBeenCalledWith({
				slug: "typescript-practice-176",
				title: "TypeScript実践テクニック 176",
				type: "article",
			});
		});
	},
};

/**
 * スクロール動作の確認
 */
export const スクロール動作: Story = {
	name: "スクロール動作",
	tags: ["code-only"],
	args: {
		open: true,
		query: "a",
		language: "ja",
		position: { top: 200, left: 100 },
		onSelect: fn(),
		onOpenChange: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("*/api/articles/suggestions", () => {
					return HttpResponse.json({
						suggestions: Array.from({ length: 20 }, (_, i) => ({
							slug: `article-${i}`,
							title: `記事タイトル ${i}`,
							type: "article",
						})),
						fromCache: false,
					});
				}),
			],
		},
	},
};

/**
 * 位置調整の確認（画面下部）
 */
export const 画面下部での表示: Story = {
	name: "画面下部での表示",
	tags: ["code-only"],
	args: {
		open: true,
		query: "type",
		language: "ja",
		position: { top: window.innerHeight - 100, left: 100 },
		onSelect: fn(),
		onOpenChange: fn(),
	},
	parameters: {},
};

/**
 * ローディング状態（実際のAPI通信をシミュレート）
 */
export const ローディング状態: Story = {
	name: "ローディング状態",
	tags: ["code-only"],
	args: {
		open: true,
		query: "loading-test",
		language: "ja",
		position: { top: 200, left: 100 },
		onSelect: fn(),
		onOpenChange: fn(),
	},
	parameters: {
		// クエリが変わった直後の状態を表示
	},
};

/**
 * 記事と見出しの混在表示
 */
export const 記事と見出しの混在: Story = {
	name: "記事と見出しの混在",
	tags: ["code-only"],
	args: {
		open: true,
		query: "実践",
		language: "ja",
		position: { top: 200, left: 100 },
		onSelect: fn(),
		onOpenChange: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("*/api/articles/suggestions", () => {
					return HttpResponse.json({
						suggestions: [
							{
								slug: "typescript-practice",
								title: "TypeScript実践ガイド",
								type: "article",
							},
							{
								slug: "react-practice",
								title: "React実践パターン",
								type: "article",
							},
							{
								slug: "nextjs-performance",
								title: "実践的な最適化手法",
								type: "heading",
								headingLevel: 2,
								headingId: "optimization-techniques",
								articleTitle: "Next.jsパフォーマンスガイド",
							},
							{
								slug: "testing-guide",
								title: "実践禄なテスト戦略",
								type: "heading",
								headingLevel: 3,
								headingId: "test-strategies",
								articleTitle: "フロントエンドテスト入門",
							},
						],
						fromCache: false,
					});
				}),
			],
		},
	},
};

/**
 * デバウンスの動作確認
 */
export const デバウンス動作確認: Story = {
	name: "デバウンス動作確認",
	tags: ["validation"],
	args: {
		open: true,
		query: "",
		language: "ja",
		position: { top: 200, left: 100 },
		onSelect: fn(),
		onOpenChange: fn(),
	},
	parameters: {},
	render: (args) => {
		const [query, setQuery] = React.useState("");

		return (
			<div>
				<div style={{ marginBottom: "20px" }}>
					<label>
						クエリを入力（300msのデバウンス）:
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							style={{ marginLeft: "10px", padding: "5px" }}
						/>
					</label>
				</div>
				<ArticleSuggestionsPopover {...args} query={query} />
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 入力フィールドを取得
		const input = canvas.getByRole("textbox");

		// 高速に入力
		await userEvent.type(input, "ty", { delay: 50 });

		// 300ms待つ前はまだサジェストが表示されない
		await waitFor(
			() => {
				const loading = canvas.queryByText("読み込み中...");
				expect(loading).toBeInTheDocument();
			},
			{ timeout: 200 }
		);

		// 300ms後にサジェストが表示される
		await waitFor(
			async () => {
				const firstItem = await canvas.findByText(
					"TypeScript実践テクニック 106"
				);
				expect(firstItem).toBeInTheDocument();
			},
			{ timeout: 1000 }
		);

		// バックスペースで削除
		await userEvent.keyboard("{Backspace}");

		// 再度300ms後に更新される
		await waitFor(
			async () => {
				// 「t」での検索結果が表示されることを確認
				const items = await canvas.findAllByRole("option");
				expect(items.length).toBeGreaterThan(0);
			},
			{ timeout: 1000 }
		);
	},
};
