import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { HttpResponse, http } from "msw";
import { ArticleNewForm } from "./article-new-form";

const meta: Meta<typeof ArticleNewForm> = {
	component: ArticleNewForm,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
		// MSWハンドラーを設定
		msw: {
			handlers: [
				// スラッグチェックAPI
				http.get("*/api/articles/check-slug", ({ request }) => {
					const url = new URL(request.url);
					const slug = url.searchParams.get("slug");
					return HttpResponse.json({
						available: slug !== "existing-slug",
						message:
							slug === "existing-slug"
								? "このスラッグは既に使用されています"
								: null,
					});
				}),
				// 記事作成API
				http.post("*/api/articles", async ({ request }) => {
					const body = (await request.json()) as Record<string, unknown>;
					return HttpResponse.json({
						data: {
							...body,
							id: "new-article-id",
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						},
					});
				}),
				// Wiki Linkサジェスト
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

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * UnixキーバインドのテストStory
 * Ctrl+N/P/B/Fのキーボードナビゲーションをテスト
 */
export const UnixKeyBindings: Story = {
	name: "Unixキーバインド（Ctrl+N/P/B/F）",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// MDEditorのテキストエリアを探す
		const editorTextarea = await waitFor(
			async () => {
				const textarea = canvas.getByRole("textbox", {
					name: "本文（Markdown形式）",
				});
				return textarea as HTMLTextAreaElement;
			},
			{ timeout: 5000 }
		);

		// テキストを入力
		await userEvent.click(editorTextarea);
		await userEvent.type(editorTextarea, "Hello World! This is a test.");

		// カーソルを中央付近に移動（15文字目）
		editorTextarea.setSelectionRange(15, 15);

		// Ctrl+Bでカーソルを左へ移動
		await userEvent.keyboard("{Control>}b{/Control}");
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(14);
			expect(editorTextarea.selectionEnd).toBe(14);
		});

		// さらにCtrl+Bで左へ
		await userEvent.keyboard("{Control>}b{/Control}");
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(13);
		});

		// Ctrl+Fでカーソルを右へ移動
		await userEvent.keyboard("{Control>}f{/Control}");
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(14);
		});

		// さらにCtrl+Fで右へ
		await userEvent.keyboard("{Control>}f{/Control}");
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(15);
		});

		// Ctrl+Bが**Bold**マークアップを追加しないことを確認
		const currentValue = editorTextarea.value;
		expect(currentValue).not.toContain("**");
		expect(currentValue).toBe("Hello World! This is a test.");
	},
};

/**
 * Wiki Link見出し選択時の形式テスト
 * 見出しを選択した場合は [[slug#見出しタイトル]] 形式で挿入されることを確認
 */
export const WikiLinkHeadingFormat: Story = {
	name: "Wiki Link見出し選択時の形式",
	tags: ["validation"],
	parameters: {
		msw: {
			handlers: [
				// スラッグチェックAPI
				http.get("*/api/articles/check-slug", ({ request }) => {
					const url = new URL(request.url);
					const slug = url.searchParams.get("slug");
					return HttpResponse.json({
						available: slug !== "existing-slug",
						message:
							slug === "existing-slug"
								? "このスラッグは既に使用されています"
								: null,
					});
				}),
				// Wiki Linkサジェスト（記事と見出しを含む）
				http.get("*/api/articles/suggestions", () => {
					return HttpResponse.json({
						suggestions: [
							{
								slug: "nextjs-performance",
								title: "Next.jsパフォーマンス最適化",
								type: "article",
							},
							{
								slug: "nextjs-performance",
								title: "基本的な概念",
								type: "heading",
								headingLevel: 2,
								headingId: "basic-concepts",
								articleTitle: "Next.jsパフォーマンス最適化",
							},
							{
								slug: "web-optimization",
								title: "基本的な概念",
								type: "heading",
								headingLevel: 2,
								headingId: "basic-concepts",
								articleTitle: "Webアプリケーション設計",
							},
						],
						fromCache: false,
					});
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// MDEditorのテキストエリアを探す
		const editorTextarea = await waitFor(
			async () => {
				const textarea = canvas.getByRole("textbox", {
					name: "本文（Markdown形式）",
				});
				return textarea as HTMLTextAreaElement;
			},
			{ timeout: 5000 }
		);

		// テストケース1: 記事を選択した場合
		await userEvent.click(editorTextarea);
		await userEvent.type(editorTextarea, "記事リンク: [[");

		// サジェストポップアップが表示されるまで待つ
		await waitFor(
			async () => {
				const firstItem = await canvas.findByText(
					"Next.jsパフォーマンス最適化"
				);
				expect(firstItem).toBeInTheDocument();
			},
			{ timeout: 5000 }
		);

		// 最初の項目（記事）をクリック
		const articleItem = canvas.getByText("Next.jsパフォーマンス最適化");
		await userEvent.click(
			articleItem.closest('[role="option"]') as HTMLElement
		);

		// [[nextjs-performance]] が挿入されたことを確認
		await waitFor(() => {
			expect(editorTextarea.value).toContain(
				"記事リンク: [[nextjs-performance]]"
			);
		});

		// テストケース2: 見出しを選択した場合
		await userEvent.type(editorTextarea, "\n\n見出しリンク: [[");

		// サジェストポップアップが表示されるまで待つ
		await waitFor(
			async () => {
				// 見出しアイテムを探す（複数の「基本的な概念」がある）
				const headingItems = await canvas.findAllByText("基本的な概念");
				expect(headingItems.length).toBeGreaterThan(0);
			},
			{ timeout: 5000 }
		);

		// 見出しアイテムを選択（Next.jsパフォーマンス最適化の方）
		const allOptions = canvas.getAllByRole("option");
		const headingOption = allOptions.find((option) => {
			const titleText = option.querySelector("span")?.textContent;
			const subtitleText = option.querySelector(
				".text-muted-foreground"
			)?.textContent;
			return (
				titleText === "基本的な概念" &&
				subtitleText === "Next.jsパフォーマンス最適化"
			);
		});

		if (headingOption) {
			await userEvent.click(headingOption);
		}

		// [[nextjs-performance#基本的な概念]] が挿入されたことを確認
		await waitFor(() => {
			expect(editorTextarea.value).toContain(
				"見出しリンク: [[nextjs-performance#基本的な概念]]"
			);
		});

		// 最終的なテキストを確認
		expect(editorTextarea.value).toBe(
			"記事リンク: [[nextjs-performance]]\n\n見出しリンク: [[nextjs-performance#基本的な概念]]"
		);
	},
};

/**
 * Wiki Link内でのUnixキーバインドのテスト
 */
export const UnixKeyBindingsWithWikiLink: Story = {
	name: "Wiki Link内でのUnixキーバインド",
	tags: ["validation"],
	parameters: {
		msw: {
			handlers: [
				// スラッグチェックAPI
				http.get("*/api/articles/check-slug", ({ request }) => {
					const url = new URL(request.url);
					const slug = url.searchParams.get("slug");
					return HttpResponse.json({
						available: slug !== "existing-slug",
						message:
							slug === "existing-slug"
								? "このスラッグは既に使用されています"
								: null,
					});
				}),
				// Wiki Linkサジェスト（モックデータ付き）
				http.get("*/api/articles/suggestions", () => {
					return HttpResponse.json({
						suggestions: [
							{
								slug: "article-1",
								title: "テスト記事1",
								type: "article",
							},
							{
								slug: "article-2",
								title: "テスト記事2",
								type: "article",
							},
							{
								slug: "article-3",
								title: "テスト記事3",
								type: "article",
							},
						],
						fromCache: false,
					});
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// MDEditorのテキストエリアを探す
		const editorTextarea = await waitFor(
			async () => {
				const textarea = canvas.getByRole("textbox", {
					name: "本文（Markdown形式）",
				});
				return textarea as HTMLTextAreaElement;
			},
			{ timeout: 5000 }
		);

		// Wiki Linkを入力
		await userEvent.click(editorTextarea);
		await userEvent.type(editorTextarea, "[[");

		// サジェストポップアップが表示されるまで待つ
		await waitFor(
			async () => {
				const firstItem = await canvas.findByText("テスト記事1");
				expect(firstItem).toBeInTheDocument();
			},
			{ timeout: 5000 }
		);

		// Wiki Link内でもCtrl+B/Fが動作することを確認
		// カーソルは[[の後ろにある
		await userEvent.keyboard("{Control>}b{/Control}");
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(1); // [と[の間
		});

		await userEvent.keyboard("{Control>}f{/Control}");
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(2); // [[の後ろ
		});

		// Ctrl+Nでサジェストを下へ移動
		await userEvent.keyboard("{Control>}n{/Control}");
		await waitFor(() => {
			const items = canvas.getAllByRole("option");
			expect(items[1]).toHaveAttribute("data-selected", "true");
		});

		// Ctrl+Pでサジェストを上へ移動
		await userEvent.keyboard("{Control>}p{/Control}");
		await waitFor(() => {
			const items = canvas.getAllByRole("option");
			expect(items[0]).toHaveAttribute("data-selected", "true");
		});
	},
};

/**
 * 境界値でのUnixキーバインドテスト
 */
export const UnixKeyBindingsBoundary: Story = {
	name: "Unixキーバインドの境界値テスト",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// MDEditorのテキストエリアを探す
		const editorTextarea = await waitFor(
			async () => {
				const textarea = canvas.getByRole("textbox", {
					name: "本文（Markdown形式）",
				});
				return textarea as HTMLTextAreaElement;
			},
			{ timeout: 5000 }
		);

		// テキストを入力
		await userEvent.click(editorTextarea);
		await userEvent.type(editorTextarea, "Test");

		// カーソルを最初に移動
		editorTextarea.setSelectionRange(0, 0);

		// 最初でCtrl+Bを押してもカーソルは0のまま
		await userEvent.keyboard("{Control>}b{/Control}");
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(0);
		});

		// カーソルを最後に移動
		editorTextarea.setSelectionRange(4, 4);

		// 最後でCtrl+Fを押してもカーソルは4のまま
		await userEvent.keyboard("{Control>}f{/Control}");
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(4);
		});
	},
};

/**
 * 選択テキストのBoldフォーマットテスト
 */
export const BoldFormattingWithSelection: Story = {
	name: "選択テキストのBoldフォーマット",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// MDEditorのテキストエリアを探す
		const editorTextarea = await waitFor(
			async () => {
				const textarea = canvas.getByRole("textbox", {
					name: "本文（Markdown形式）",
				});
				return textarea as HTMLTextAreaElement;
			},
			{ timeout: 5000 }
		);

		// テキストを入力
		await userEvent.click(editorTextarea);
		await userEvent.type(editorTextarea, "This is a test text.");

		// "test"を選択（10文字目から14文字目）
		editorTextarea.setSelectionRange(10, 14);

		// Cmd+BでBoldフォーマットを適用
		await userEvent.keyboard("{Meta>}b{/Meta}");

		// Bold記号が追加されたことを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("This is a **test** text.");
			// 選択範囲がBold記号の内側にあることを確認
			expect(editorTextarea.selectionStart).toBe(12); // **の後
			expect(editorTextarea.selectionEnd).toBe(16); // **の前
		});

		// もう一度Cmd+BでBoldを解除
		await userEvent.keyboard("{Meta>}b{/Meta}");

		// Bold記号が削除されたことを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("This is a test text.");
			expect(editorTextarea.selectionStart).toBe(10);
			expect(editorTextarea.selectionEnd).toBe(14);
		});
	},
};

/**
 * 選択なしでのCtrl+Bカーソル移動テスト
 */
export const CtrlBCursorMovementWithoutSelection: Story = {
	name: "選択なしでのCtrl+Bカーソル移動",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// MDEditorのテキストエリアを探す
		const editorTextarea = await waitFor(
			async () => {
				const textarea = canvas.getByRole("textbox", {
					name: "本文（Markdown形式）",
				});
				return textarea as HTMLTextAreaElement;
			},
			{ timeout: 5000 }
		);

		// テキストを入力
		await userEvent.click(editorTextarea);
		await userEvent.type(editorTextarea, "Test");

		// カーソルを最後に配置（選択なし）
		editorTextarea.setSelectionRange(4, 4);

		// Ctrl+Bでカーソルを左へ移動
		await userEvent.keyboard("{Control>}b{/Control}");

		// カーソルが左に移動し、テキストは変更されないことを確認
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(3);
			expect(editorTextarea.selectionEnd).toBe(3);
			expect(editorTextarea.value).toBe("Test"); // テキストは変更されない
		});
	},
};

/**
 * Cmd+BでBoldフォーマット、Ctrl+Bでカーソル移動の確認
 */
export const CmdBAndCtrlBBehavior: Story = {
	name: "Cmd+BでBold、Ctrl+Bでカーソル移動",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// MDEditorのテキストエリアを探す
		const editorTextarea = await waitFor(
			async () => {
				const textarea = canvas.getByRole("textbox", {
					name: "本文（Markdown形式）",
				});
				return textarea as HTMLTextAreaElement;
			},
			{ timeout: 5000 }
		);

		// テキストを入力
		await userEvent.click(editorTextarea);
		await userEvent.type(editorTextarea, "Bold test text");

		// 選択ありの場合：Cmd+BでBoldフォーマット適用
		editorTextarea.setSelectionRange(5, 9); // "test"を選択

		// Cmd+BでBoldフォーマットを適用
		await userEvent.keyboard("{Meta>}b{/Meta}");

		// Bold記号が追加されたことを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("Bold **test** text");
		});

		// 選択なしの場合：Ctrl+Bでカーソル移動
		editorTextarea.setSelectionRange(5, 5);

		// Ctrl+Bでカーソル移動（Unixキーバインド）
		await userEvent.keyboard("{Control>}b{/Control}");

		// カーソルが左に移動したことを確認
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(4);
		});

		// サイドバーが開閉していないことを確認するため、
		// ドキュメント全体でサイドバー関連の要素が変更されていないことを確認
		// （Storybookの環境ではサイドバーは存在しないが、イベントが伝播していないことを確認）
		const sidebarTriggers = canvas.queryAllByRole("button", {
			name: /toggle sidebar/i,
		});
		expect(sidebarTriggers).toHaveLength(0);
	},
};

/**
 * エディターショートカットの包括的テスト
 * 無効化されたショートカットと有効なショートカットの動作を確認
 */
export const ComprehensiveShortcutTest: Story = {
	name: "エディターショートカット包括テスト",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// MDEditorのテキストエリアを探す
		const editorTextarea = await waitFor(
			async () => {
				const textarea = canvas.getByRole("textbox", {
					name: "本文（Markdown形式）",
				});
				return textarea as HTMLTextAreaElement;
			},
			{ timeout: 5000 }
		);

		// テキストを入力
		await userEvent.click(editorTextarea);
		await userEvent.type(editorTextarea, "Test content for shortcuts");

		// 初期状態を記録
		const initialText = editorTextarea.value;
		const _initialCursorPos = editorTextarea.selectionStart;

		// === 無効化されたショートカットのテスト ===

		// 1. Ctrl+K: MDEditorのデフォルト動作を無効化
		await userEvent.keyboard("{Control>}k{/Control}");
		await waitFor(() => {
			expect(editorTextarea.value).toBe(initialText);
		});

		// 2. Cmd+K: MDEditorのデフォルト動作を無効化
		await userEvent.keyboard("{Meta>}k{/Meta}");
		await waitFor(() => {
			expect(editorTextarea.value).toBe(initialText);
		});

		// 3. Ctrl+H: HR挿入機能を無効化
		await userEvent.keyboard("{Control>}h{/Control}");
		await waitFor(() => {
			expect(editorTextarea.value).toBe(initialText);
			expect(editorTextarea.value).not.toContain("---");
		});

		// 4. Cmd+H: HR挿入機能を無効化
		await userEvent.keyboard("{Meta>}h{/Meta}");
		await waitFor(() => {
			expect(editorTextarea.value).toBe(initialText);
			expect(editorTextarea.value).not.toContain("---");
		});

		// 5. Cmd+L: 完全に無効化
		await userEvent.keyboard("{Meta>}l{/Meta}");
		await waitFor(() => {
			expect(editorTextarea.value).toBe(initialText);
		});

		// === 有効なショートカットのテスト ===

		// 6. Ctrl+B: カーソル左移動（Unixキーバインド）
		const beforeCtrlB = editorTextarea.selectionStart;
		await userEvent.keyboard("{Control>}b{/Control}");
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(beforeCtrlB - 1);
			expect(editorTextarea.value).toBe(initialText); // テキストは変更されない
		});

		// 7. Ctrl+F: カーソル右移動（Unixキーバインド）
		const beforeCtrlF = editorTextarea.selectionStart;
		await userEvent.keyboard("{Control>}f{/Control}");
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(beforeCtrlF + 1);
			expect(editorTextarea.value).toBe(initialText); // テキストは変更されない
		});

		// 8. Cmd+B: Boldフォーマット（選択時のみ）
		editorTextarea.setSelectionRange(5, 12); // "content"を選択
		await userEvent.keyboard("{Meta>}b{/Meta}");
		await waitFor(() => {
			expect(editorTextarea.value).toBe("Test **content** for shortcuts");
		});

		// Bold解除も確認
		editorTextarea.setSelectionRange(7, 14); // "content"を選択（**を含む位置）
		await userEvent.keyboard("{Meta>}b{/Meta}");
		await waitFor(() => {
			expect(editorTextarea.value).toBe(initialText); // 元に戻る
		});

		// 9. Cmd+I: Italic（MDEditor標準機能、無効化していない）
		editorTextarea.setSelectionRange(5, 12); // "content"を選択
		await userEvent.keyboard("{Meta>}i{/Meta}");
		await waitFor(() => {
			expect(editorTextarea.value).toBe("Test *content* for shortcuts");
		});

		// Italic解除も確認
		editorTextarea.setSelectionRange(6, 13); // "content"を選択（*を含む位置）
		await userEvent.keyboard("{Meta>}i{/Meta}");
		await waitFor(() => {
			expect(editorTextarea.value).toBe(initialText); // 元に戻る
		});

		// === 競合がないことの確認 ===
		// 複数のショートカットを連続実行して互いに干渉しないことを確認

		// カーソルを中央に移動
		editorTextarea.setSelectionRange(10, 10);

		// Ctrl+B (左移動) → Ctrl+F (右移動) を連続実行
		await userEvent.keyboard("{Control>}b{/Control}");
		await userEvent.keyboard("{Control>}f{/Control}");
		await waitFor(() => {
			expect(editorTextarea.selectionStart).toBe(10); // 元の位置に戻る
			expect(editorTextarea.value).toBe(initialText); // テキストは変更されない
		});
	},
};

/**
 * 基本的なフォーム表示
 */
export const BasicForm: Story = {
	name: "基本的なフォーム表示",
	tags: ["code-only"],
};

/**
 * MDEditorクリック領域拡張のテスト
 * エディター内のどこをクリックしてもテキストエリアにフォーカスが当たることを確認
 */
export const ExpandedClickArea: Story = {
	name: "MDEditorクリック領域拡張テスト",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// MDEditorのテキストエリアを探す
		const editorTextarea = await waitFor(
			async () => {
				const textarea = canvas.getByRole("textbox", {
					name: "本文（Markdown形式）",
				});
				return textarea as HTMLTextAreaElement;
			},
			{ timeout: 5000 }
		);

		// 初期状態でテキストを入力
		await userEvent.click(editorTextarea);
		await userEvent.type(
			editorTextarea,
			"Initial content\n\nSecond line\n\nThird line"
		);

		// テキストエリアのフォーカスを外す
		const titleInput = canvas.getByLabelText("タイトル");
		await userEvent.click(titleInput);

		// テキストエリアがフォーカスを失ったことを確認
		expect(document.activeElement).not.toBe(editorTextarea);

		// MDEditorコンテナを取得
		const editorContainer = editorTextarea.closest(
			".w-md-editor"
		) as HTMLElement;
		expect(editorContainer).toBeInTheDocument();

		// プレビュー側の領域をクリック（.w-md-editor-previewを探す）
		const previewArea = editorContainer.querySelector(
			".w-md-editor-preview"
		) as HTMLElement;
		if (previewArea) {
			await userEvent.click(previewArea);

			// テキストエリアにフォーカスが当たったことを確認
			await waitFor(() => {
				expect(document.activeElement).toBe(editorTextarea);
			});

			// カーソルが最後に移動していることを確認
			const expectedLength = "Initial content\n\nSecond line\n\nThird line"
				.length;
			expect(editorTextarea.selectionStart).toBe(expectedLength);
			expect(editorTextarea.selectionEnd).toBe(expectedLength);
		}

		// 再度フォーカスを外す
		await userEvent.click(titleInput);
		expect(document.activeElement).not.toBe(editorTextarea);

		// エディター側（左側）の空白部分をクリック
		const editorSide = editorContainer.querySelector(
			".w-md-editor-text"
		) as HTMLElement;
		if (editorSide) {
			await userEvent.click(editorSide);

			// テキストエリアにフォーカスが当たったことを確認
			await waitFor(() => {
				expect(document.activeElement).toBe(editorTextarea);
			});
		}

		// ツールバーのボタンをクリックしても通常の動作をすることを確認
		// （フォーカスが奪われないことを確認）
		const boldButton = editorContainer.querySelector(
			'[data-name="bold"]'
		) as HTMLElement;
		if (boldButton) {
			// 一部のテキストを選択
			editorTextarea.setSelectionRange(0, 7); // "Initial"を選択

			await userEvent.click(boldButton);

			// テキストにBoldが適用されたことを確認
			await waitFor(() => {
				expect(editorTextarea.value).toBe(
					"**Initial** content\n\nSecond line\n\nThird line"
				);
			});
		}
	},
};

/**
 * スラッグ重複エラーの表示
 */
export const SlugDuplicateError: Story = {
	name: "スラッグ重複エラー",
	tags: ["code-only"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// スラッグフィールドに既存のスラッグを入力
		const slugInput = canvas.getByLabelText("スラッグ");
		await userEvent.type(slugInput, "existing-slug");

		// エラーメッセージが表示されるまで待つ
		await waitFor(
			() => {
				const errorMessage = canvas.getByText(
					"このスラッグは既に使用されています"
				);
				expect(errorMessage).toBeInTheDocument();
			},
			{ timeout: 3000 }
		);
	},
};

/**
 * 括弧ペア削除時のカーソル位置バグ修正テスト
 * {{}}の最後の}を削除した時、カーソルが正しい位置に配置されることを確認
 */
export const BracketPairDeletionCursorFix: Story = {
	name: "括弧ペア削除カーソル位置修正",
	tags: ["validation"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// MDEditorのテキストエリアを探す
		const editorTextarea = await waitFor(
			async () => {
				const textarea = canvas.getByRole("textbox", {
					name: "本文（Markdown形式）",
				});
				return textarea as HTMLTextAreaElement;
			},
			{ timeout: 5000 }
		);

		// テストケース1: {{}}の最後の}を削除
		await userEvent.click(editorTextarea);
		await userEvent.type(editorTextarea, "{{}}");

		// カーソルを最後の}の後に配置
		editorTextarea.setSelectionRange(4, 4);

		// Backspaceで最後の}を削除
		await userEvent.keyboard("{Backspace}");

		// テキストが{{}になり、カーソルが最後の}の後（位置3）にあることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("{{}");
			expect(editorTextarea.selectionStart).toBe(3);
			expect(editorTextarea.selectionEnd).toBe(3);
		});

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース2: {{}}の最後の}をCtrl+Hで削除
		await userEvent.type(editorTextarea, "{{}}");
		editorTextarea.setSelectionRange(4, 4);

		// Ctrl+Hで最後の}を削除
		await userEvent.keyboard("{Control>}h{/Control}");

		// テキストが{{}になり、カーソルが最後の}の後（位置3）にあることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("{{}");
			expect(editorTextarea.selectionStart).toBe(3);
			expect(editorTextarea.selectionEnd).toBe(3);
		});

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース3: ネストした括弧での削除
		await userEvent.type(editorTextarea, "{{{text}}}");

		// 最後の}を削除（位置9の後）
		editorTextarea.setSelectionRange(9, 9);
		await userEvent.keyboard("{Backspace}");

		// テキストが{{{text}}になり、カーソルが最後の}の後（位置8）にあることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("{{{text}}");
			expect(editorTextarea.selectionStart).toBe(8);
			expect(editorTextarea.selectionEnd).toBe(8);
		});

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース4: 最初の{を削除する場合
		await userEvent.type(editorTextarea, "{{}}");

		// 最初の{の前に配置（位置1）
		editorTextarea.setSelectionRange(1, 1);
		await userEvent.keyboard("{Backspace}");

		// テキストが{}}になり、カーソルが最初の{の前（位置0）にあることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("{}}");
			expect(editorTextarea.selectionStart).toBe(0);
			expect(editorTextarea.selectionEnd).toBe(0);
		});

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース5: その他の括弧でも同様に動作することを確認
		await userEvent.type(editorTextarea, "((()))");

		// 最後の)を削除
		editorTextarea.setSelectionRange(6, 6);
		await userEvent.keyboard("{Backspace}");

		// テキストが(((()))になり、カーソルが最後の)の後（位置5）にあることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("(((()))");
			expect(editorTextarea.selectionStart).toBe(5);
			expect(editorTextarea.selectionEnd).toBe(5);
		});

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース6: [[]]の最後の]を削除した時、[]が残ることを確認（バグ修正テスト）
		await userEvent.type(editorTextarea, "[[]]");

		// 最後の]の後に配置（位置4）

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース8: Ctrl+Hでの[[]]の最後の]削除もカーソル位置が正しいことを確認
		await userEvent.type(editorTextarea, "[[]]");

		// 最後の]の後に配置（位置4）
		editorTextarea.setSelectionRange(4, 4);
		await userEvent.keyboard("{Control>}h{/Control}");

		// テキストが[]になり、カーソルが]の後（位置2）にあることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("[]");
			expect(editorTextarea.selectionStart).toBe(2);
			expect(editorTextarea.selectionEnd).toBe(2);
		});
		editorTextarea.setSelectionRange(4, 4);
		await userEvent.keyboard("{Backspace}");

		// テキストが[]になり、カーソルが]の後（位置2）にあることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("[]");
			expect(editorTextarea.selectionStart).toBe(2);
			expect(editorTextarea.selectionEnd).toBe(2);
		});

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース7: [[]]の最初の[を削除した時、[]が残ることを確認
		await userEvent.type(editorTextarea, "[[]]");

		// 最初の[の後に配置（位置1）
		editorTextarea.setSelectionRange(1, 1);
		await userEvent.keyboard("{Backspace}");

		// テキストが[]になり、カーソルが[の前（位置0）にあることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("[]");
			expect(editorTextarea.selectionStart).toBe(0);
			expect(editorTextarea.selectionEnd).toBe(0);
		});
	},
};

/**
 * Ctrl+Dで前方削除（Delete相当）の動作をテスト
 */
export const CtrlDForwardDelete: Story = {
	name: "Ctrl+Dで前方削除（Forward Delete）",
	tags: ["validation"],
	play: async ({ canvas }) => {
		const editorContainer = await within(canvas as HTMLElement).findByTestId(
			"md-editor"
		);
		const editorTextarea = within(editorContainer).getByRole(
			"textbox"
		) as HTMLTextAreaElement;

		// テストケース1: 通常の文字の前方削除
		await userEvent.type(editorTextarea, "Hello World");

		// カーソルを"Hello"の後に配置（位置5）
		editorTextarea.setSelectionRange(5, 5);
		await userEvent.keyboard("{Control>}d{/Control}");

		// スペースが削除されて"HelloWorld"になることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("HelloWorld");
			expect(editorTextarea.selectionStart).toBe(5);
			expect(editorTextarea.selectionEnd).toBe(5);
		});

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース2: 行末でのCtrl+D（何も削除されない）
		await userEvent.type(editorTextarea, "Test");

		// カーソルを最後に配置（位置4）
		editorTextarea.setSelectionRange(4, 4);
		await userEvent.keyboard("{Control>}d{/Control}");

		// 何も変わらないことを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("Test");
			expect(editorTextarea.selectionStart).toBe(4);
			expect(editorTextarea.selectionEnd).toBe(4);
		});

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース3: 括弧ペアの前方削除
		await userEvent.type(editorTextarea, "()");

		// カーソルを(の後に配置（位置1）
		editorTextarea.setSelectionRange(1, 1);
		await userEvent.keyboard("{Control>}d{/Control}");

		// 括弧ペアが削除されて空になることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("");
			expect(editorTextarea.selectionStart).toBe(0);
			expect(editorTextarea.selectionEnd).toBe(0);
		});

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース4: [[]]での前方削除
		await userEvent.type(editorTextarea, "[[]]");

		// カーソルを最初の[の後に配置（位置1）
		editorTextarea.setSelectionRange(1, 1);
		await userEvent.keyboard("{Control>}d{/Control}");

		// 内側の括弧だけ削除されて[]になることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("[]");
			expect(editorTextarea.selectionStart).toBe(1);
			expect(editorTextarea.selectionEnd).toBe(1);
		});

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース5: 選択範囲がある場合のCtrl+D
		await userEvent.type(editorTextarea, "Selected Text");

		// "Selected"を選択（位置0-8）
		editorTextarea.setSelectionRange(0, 8);
		await userEvent.keyboard("{Control>}d{/Control}");

		// 選択範囲が削除されることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe(" Text");
			expect(editorTextarea.selectionStart).toBe(0);
			expect(editorTextarea.selectionEnd).toBe(0);
		});

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース6: 改行の前方削除
		await userEvent.type(editorTextarea, "Line1{Enter}Line2");

		// Line1の後、改行の前に配置（位置5）
		editorTextarea.setSelectionRange(5, 5);
		await userEvent.keyboard("{Control>}d{/Control}");

		// 改行が削除されてLine1Line2になることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("Line1Line2");
			expect(editorTextarea.selectionStart).toBe(5);
			expect(editorTextarea.selectionEnd).toBe(5);
		});
	},
};

/**
 * [[入力時にWiki Link Popoverが表示されることをテスト
 */
export const WikiLinkPopoverAppears: Story = {
	name: "[[入力時にWiki Link Popoverが表示される",
	tags: ["validation"],
	play: async ({ canvas }) => {
		const editorContainer = await within(canvas as HTMLElement).findByTestId(
			"md-editor"
		);
		const editorTextarea = within(editorContainer).getByRole(
			"textbox"
		) as HTMLTextAreaElement;

		// テストケース1: [[入力でPopoverが表示される
		await userEvent.type(editorTextarea, "[[");

		// Wiki Link サジェストポップアップが表示されることを確認
		await waitFor(
			() => {
				const popup = within(canvas as HTMLElement).queryByTestId(
					"wiki-link-suggestions"
				);
				expect(popup).toBeInTheDocument();
			},
			{ timeout: 2000 }
		);

		// リセット
		await userEvent.clear(editorTextarea);

		// Wiki Link サジェストポップアップが非表示になることを確認
		await waitFor(
			() => {
				const popup = within(canvas as HTMLElement).queryByTestId(
					"wiki-link-suggestions"
				);
				expect(popup).not.toBeInTheDocument();
			},
			{ timeout: 1000 }
		);

		// テストケース2: [[文字入力でもPopoverが表示される
		await userEvent.type(editorTextarea, "[[test");

		// Wiki Link サジェストポップアップが表示されることを確認
		await waitFor(
			() => {
				const popup = within(canvas as HTMLElement).queryByTestId(
					"wiki-link-suggestions"
				);
				expect(popup).toBeInTheDocument();
			},
			{ timeout: 2000 }
		);

		// テストケース3: [[article-040#で見出しサジェストが表示される
		await userEvent.clear(editorTextarea);
		await userEvent.type(editorTextarea, "[[article-040#");

		// Wiki Link サジェストポップアップが表示されることを確認
		await waitFor(
			() => {
				const popup = within(canvas as HTMLElement).queryByTestId(
					"wiki-link-suggestions"
				);
				expect(popup).toBeInTheDocument();
			},
			{ timeout: 2000 }
		);
	},
};

/**
 * 日本語入力時にWiki Link Popoverが正常に表示されることをテスト
 */
export const WikiLinkJapaneseInput: Story = {
	name: "日本語入力時にWiki Link Popoverが表示される",
	tags: ["validation"],
	play: async ({ canvas }) => {
		const editorContainer = await within(canvas as HTMLElement).findByTestId(
			"md-editor"
		);
		const editorTextarea = within(editorContainer).getByRole(
			"textbox"
		) as HTMLTextAreaElement;

		// テストケース1: 日本語のみでPopoverが表示される
		await userEvent.type(editorTextarea, "[[概念");

		// Wiki Link サジェストポップアップが表示されることを確認
		await waitFor(
			() => {
				const popup = within(canvas as HTMLElement).queryByTestId(
					"wiki-link-suggestions"
				);
				expect(popup).toBeInTheDocument();
			},
			{ timeout: 2000 }
		);

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース2: 英語と日本語の混合でPopoverが表示される
		await userEvent.type(editorTextarea, "[[React開発");

		// Wiki Link サジェストポップアップが表示されることを確認
		await waitFor(
			() => {
				const popup = within(canvas as HTMLElement).queryByTestId(
					"wiki-link-suggestions"
				);
				expect(popup).toBeInTheDocument();
			},
			{ timeout: 2000 }
		);

		// リセット
		await userEvent.clear(editorTextarea);

		// テストケース3: 完成したWiki Linkでカーソルが内部にある場合もPopoverが表示される
		await userEvent.type(editorTextarea, "[[概念]]");

		// カーソルを「概念」と「]]」の間に移動
		editorTextarea.setSelectionRange(4, 4); // "[[概念" の後にカーソルを配置

		// 少し待ってからチェック（カーソル移動後の処理を待つ）
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Wiki Link サジェストポップアップが表示されることを確認
		await waitFor(
			() => {
				const popup = within(canvas as HTMLElement).queryByTestId(
					"wiki-link-suggestions"
				);
				expect(popup).toBeInTheDocument();
			},
			{ timeout: 2000 }
		);

		// テストケース4: 日本語での見出しサジェスト
		await userEvent.clear(editorTextarea);
		await userEvent.type(editorTextarea, "[[記事名#概");

		// Wiki Link サジェストポップアップが表示されることを確認
		await waitFor(
			() => {
				const popup = within(canvas as HTMLElement).queryByTestId(
					"wiki-link-suggestions"
				);
				expect(popup).toBeInTheDocument();
			},
			{ timeout: 2000 }
		);
	},
};

/**
 * Popoverが入力中のテキストと重ならないことをテスト
 */
export const WikiLinkPopoverPositioning: Story = {
	name: "Popover位置が入力テキストと重ならない",
	tags: ["validation"],
	play: async ({ canvas }) => {
		const editorContainer = await within(canvas as HTMLElement).findByTestId(
			"md-editor"
		);
		const editorTextarea = within(editorContainer).getByRole(
			"textbox"
		) as HTMLTextAreaElement;

		// 複数行のテキストを入力して、下の方でWiki Linkを入力
		const multilineText = `# タイトル

これは最初の段落です。

## セクション1
ここには長いテキストが入ります。ここには長いテキストが入ります。
ここには長いテキストが入ります。ここには長いテキストが入ります。

## セクション2
さらに多くのテキストを追加します。さらに多くのテキストを追加します。
さらに多くのテキストを追加します。さらに多くのテキストを追加します。

最後の行で Wiki Link を入力: `;

		await userEvent.type(editorTextarea, multilineText);
		await userEvent.type(editorTextarea, "[[記事");

		// Wiki Link サジェストポップアップが表示されることを確認
		await waitFor(
			() => {
				const popup = within(canvas as HTMLElement).queryByTestId(
					"wiki-link-suggestions"
				);
				expect(popup).toBeInTheDocument();
			},
			{ timeout: 2000 }
		);

		// Popoverの位置を取得
		const popup = within(canvas as HTMLElement).getByTestId(
			"wiki-link-suggestions"
		);
		const popupRect = popup.getBoundingClientRect();

		// エディタの位置を取得
		const editorRect = editorTextarea.getBoundingClientRect();

		// カーソル位置（最後の文字位置）を推定
		const textLines = editorTextarea.value.split("\n");
		const estimatedLineHeight = 24; // MDEditorの推定行高
		const estimatedCursorTop =
			editorRect.top + (textLines.length - 1) * estimatedLineHeight;

		// Popoverが入力中のテキストと重ならないことを確認
		// Popoverの下端がカーソル位置より上にあるか、
		// Popoverの上端がカーソル位置より十分下にあること
		const isAboveCursor = popupRect.bottom < estimatedCursorTop - 5; // 5pxのマージン
		const isBelowCursor =
			popupRect.top > estimatedCursorTop + estimatedLineHeight + 5; // 5pxのマージン

		expect(isAboveCursor || isBelowCursor).toBe(true);

		// デバッグ情報を出力（テスト時に位置を確認するため）
		console.log("Popup position:", {
			top: popupRect.top,
			bottom: popupRect.bottom,
		});
		console.log("Estimated cursor position:", estimatedCursorTop);
		console.log("Is above cursor:", isAboveCursor);
		console.log("Is below cursor:", isBelowCursor);
	},
};

export const WikiLinkHashNotTriggerTag: Story = {
	name: "WikiLink内の#はタグサジェストを表示しない",
	play: async ({ canvas }) => {
		// エディタのtextareaを取得
		const editorContainer = within(canvas as HTMLElement).getByRole("textbox", {
			name: /本文/,
		});
		const editorTextarea = editorContainer.querySelector(
			".w-md-editor-text-input"
		) as HTMLTextAreaElement;
		expect(editorTextarea).toBeInTheDocument();

		// エディタに Wiki Link を入力
		await userEvent.clear(editorTextarea);
		await userEvent.type(editorTextarea, "[[article-038#はじめに]]");

		// カーソルを「はじめに」の部分に移動（#の後）
		const textLength = editorTextarea.value.length;
		const hashPosition = editorTextarea.value.indexOf("#");
		// #の後の「は」の位置にカーソルを設定
		editorTextarea.setSelectionRange(hashPosition + 2, hashPosition + 2);

		// selectionchange イベントを発火
		const selectionChangeEvent = new Event("selectionchange", {
			bubbles: true,
		});
		document.dispatchEvent(selectionChangeEvent);

		// 少し待機
		await new Promise((resolve) => setTimeout(resolve, 300));

		// タグサジェストポップアップが表示されていないことを確認
		const tagPopup = within(canvas as HTMLElement).queryByTestId(
			"tag-suggestions"
		);
		expect(tagPopup).not.toBeInTheDocument();

		// Wiki Link サジェストポップアップも表示されていないことを確認
		const wikiLinkPopup = within(canvas as HTMLElement).queryByTestId(
			"wiki-link-suggestions"
		);
		expect(wikiLinkPopup).not.toBeInTheDocument();
	},
};

export const WikiLinkClosingBracketsNotTriggerTag: Story = {
	name: "WikiLink閉じ括弧の間でタグサジェストを表示しない",
	play: async ({ canvas }) => {
		// エディタのtextareaを取得
		const editorContainer = within(canvas as HTMLElement).getByRole("textbox", {
			name: /本文/,
		});
		const editorTextarea = editorContainer.querySelector(
			".w-md-editor-text-input"
		) as HTMLTextAreaElement;
		expect(editorTextarea).toBeInTheDocument();

		// エディタに Wiki Link を入力
		await userEvent.clear(editorTextarea);
		await userEvent.type(editorTextarea, "[[article-038]]");

		// カーソルを ]] の間に移動（最後から1文字前）
		const textLength = editorTextarea.value.length;
		editorTextarea.setSelectionRange(textLength - 1, textLength - 1);

		// selectionchange イベントを発火
		const selectionChangeEvent = new Event("selectionchange", {
			bubbles: true,
		});
		document.dispatchEvent(selectionChangeEvent);

		// 少し待機
		await new Promise((resolve) => setTimeout(resolve, 300));

		// タグサジェストポップアップが表示されていないことを確認
		const tagPopup = within(canvas as HTMLElement).queryByTestId(
			"tag-suggestions"
		);
		expect(tagPopup).not.toBeInTheDocument();
	},
};
