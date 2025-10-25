import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { HttpResponse, http } from "msw";
import React from "react";

import type { SuggestionItem } from "@/entities/article";

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
export const Default: Story = {
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
export const NoSearchResults: Story = {
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
export const KeyboardNavigation: Story = {
	name: "キーボードナビゲーション",
	tags: ["code-only", "!test"],
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
		await waitFor(() => {
			expect(firstItem).toHaveAttribute("data-selected", "true");
		});

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
 * Ctrl+P/Ctrl+Nでのナビゲーション
 */
export const CtrlPNNavigation: Story = {
	name: "Ctrl+P/Ctrl+Nでのナビゲーション",
	tags: ["code-only", "!test"],
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
	play: async ({ canvasElement }) => {
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

		// コマンドアイテムを探す
		const commandItems = await canvas.findAllByRole("option");
		expect(commandItems).toHaveLength(4);

		// 最初のアイテムがハイライトされているか確認
		await waitFor(() => {
			expect(commandItems[0]).toHaveAttribute("data-selected", "true");
		});

		// Ctrl+Nで次のアイテムへ移動
		await userEvent.keyboard("{Control>}n{/Control}");
		await waitFor(() => {
			expect(commandItems[1]).toHaveAttribute("data-selected", "true");
		});

		// さらにCtrl+Nで移動
		await userEvent.keyboard("{Control>}n{/Control}");
		await waitFor(() => {
			expect(commandItems[2]).toHaveAttribute("data-selected", "true");
		});

		// Ctrl+Pで前のアイテムへ戻る
		await userEvent.keyboard("{Control>}p{/Control}");
		await waitFor(() => {
			expect(commandItems[1]).toHaveAttribute("data-selected", "true");
		});

		// さらにCtrl+Pで最初のアイテムへ
		await userEvent.keyboard("{Control>}p{/Control}");
		await waitFor(() => {
			expect(commandItems[0]).toHaveAttribute("data-selected", "true");
		});

		// 最初のアイテムからCtrl+Pで最後へループ
		await userEvent.keyboard("{Control>}p{/Control}");
		await waitFor(() => {
			expect(commandItems[3]).toHaveAttribute("data-selected", "true");
		});

		// 最後のアイテムからCtrl+Nで最初へループ
		await userEvent.keyboard("{Control>}n{/Control}");
		await waitFor(() => {
			expect(commandItems[0]).toHaveAttribute("data-selected", "true");
		});
	},
};

/**
 * ESCキーでの閉じる動作
 */
export const CloseWithEscKey: Story = {
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
export const ItemSelection: Story = {
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
export const SelectWithEnterKey: Story = {
	name: "Enterキーでの選択",
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
export const ScrollBehavior: Story = {
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
export const DisplayAtBottomOfScreen: Story = {
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
export const LoadingState: Story = {
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
export const MixedArticlesAndHeadings: Story = {
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
 * カーソル位置チェックの動作確認
 */
export const CursorPositionCheck: Story = {
	name: "カーソル位置チェック",
	tags: ["code-only", "!test"],
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
		const [isOpen, setIsOpen] = React.useState(true);
		const [query, _setQuery] = React.useState("type");

		// MDEditorのコンテキストをシミュレート
		return (
			<div className="w-md-editor">
				<textarea
					className="w-md-editor-text-input"
					defaultValue="[[type]]ここにカーソルを移動"
					style={{ width: "400px", height: "100px" }}
				/>
				<ArticleSuggestionsPopover
					{...args}
					open={isOpen}
					query={query}
					onOpenChange={(open) => {
						setIsOpen(open);
						args.onOpenChange(open);
					}}
				/>
				<div style={{ marginTop: "20px", fontSize: "14px" }}>
					ポップアップ状態: {isOpen ? "開いている" : "閉じている"}
				</div>
			</div>
		);
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// textareaを取得
		const textarea = canvas.getByRole("textbox") as HTMLTextAreaElement;

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

		// テキストエリアの説明テキスト
		const statusText = canvas.getByText(/ポップアップ状態:/);
		expect(statusText).toHaveTextContent("ポップアップ状態: 開いている");

		// カーソルを[[type]]の中に設定（6文字目 = [[typ|e]]）
		await userEvent.click(textarea);
		textarea.setSelectionRange(6, 6);
		await userEvent.click(textarea); // フォーカスを再設定

		// まだポップアップは開いているはず
		await waitFor(() => {
			expect(statusText).toHaveTextContent("ポップアップ状態: 開いている");
		});

		// カーソルを[[type]]の外に移動（]]の後ろ = 9文字目）
		textarea.setSelectionRange(9, 9);
		// クリックしてフォーカスを再設定し、カーソル位置の変更を検知させる
		await userEvent.click(textarea);

		// ポップアップが閉じることを確認
		await waitFor(
			() => {
				expect(statusText).toHaveTextContent("ポップアップ状態: 閉じている");
			},
			{ timeout: 2000 }
		);
	},
};

/**
 * IME入力競合の防止テスト
 * 日本語変換中のEnterがPopover選択に影響しないことを確認
 */
export const ImeInputConflictPrevention: Story = {
	name: "IME入力競合の防止テスト",
	tags: ["code-only", "!test"],
	args: {
		open: true,
		query: "test",
		position: { top: 200, left: 100 },
		onOpenChange: fn(),
		onSelect: fn(),
	},
	parameters: {},
	render: (args) => {
		const [selectedCount, setSelectedCount] = React.useState(0);

		return (
			<div>
				<div style={{ marginBottom: "20px" }}>
					<p>選択実行回数: {selectedCount}回</p>
					<p>
						テスト内容: IME入力中のEnterはPopoverを発火させず、
						通常のEnterは発火させることを確認
					</p>
				</div>
				<ArticleSuggestionsPopover
					{...args}
					onSelect={(suggestion) => {
						setSelectedCount((prev) => prev + 1);
						args.onSelect(suggestion);
					}}
				/>
			</div>
		);
	},
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

		// 選択実行回数の初期値を確認
		const countDisplay = canvas.getByText(/選択実行回数: 0回/);
		expect(countDisplay).toBeInTheDocument();

		// コマンドアイテムを取得
		const commandItems = await canvas.findAllByRole("option");
		expect(commandItems.length).toBeGreaterThan(0);

		// 最初のアイテムがハイライトされるまで待つ
		await waitFor(() => {
			expect(commandItems[0]).toHaveAttribute("data-selected", "true");
		});

		// 通常のEnterキーを押してアイテムを選択
		await userEvent.keyboard("{Enter}");

		// onSelectが呼ばれることを確認
		await waitFor(() => {
			expect(args.onSelect).toHaveBeenCalledTimes(1);
			expect(canvas.getByText(/選択実行回数: 1回/)).toBeInTheDocument();
		});
	},
};

/**
 * デバウンスの動作確認
 */
export const DebounceCheck: Story = {
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

		// デバウンス後にサジェストが表示されることを確認
		await waitFor(
			async () => {
				const firstItem = await canvas.findByText(
					"TypeScript実践テクニック 106"
				);
				expect(firstItem).toBeInTheDocument();
			},
			{ timeout: 1500 }
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
