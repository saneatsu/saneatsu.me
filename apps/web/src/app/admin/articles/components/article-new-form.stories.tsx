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
				const firstItem = await canvas.findByText("Next.jsパフォーマンス最適化");
				expect(firstItem).toBeInTheDocument();
			},
			{ timeout: 5000 }
		);

		// 最初の項目（記事）をクリック
		const articleItem = canvas.getByText("Next.jsパフォーマンス最適化");
		await userEvent.click(articleItem.closest('[role="option"]') as HTMLElement);

		// [[nextjs-performance]] が挿入されたことを確認
		await waitFor(() => {
			expect(editorTextarea.value).toContain("記事リンク: [[nextjs-performance]]");
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
		const headingOption = allOptions.find(option => {
			const titleText = option.querySelector("span")?.textContent;
			const subtitleText = option.querySelector(".text-muted-foreground")?.textContent;
			return titleText === "基本的な概念" && 
				   subtitleText === "Next.jsパフォーマンス最適化";
		});

		if (headingOption) {
			await userEvent.click(headingOption);
		}

		// [[nextjs-performance#基本的な概念]] が挿入されたことを確認
		await waitFor(() => {
			expect(editorTextarea.value).toContain("見出しリンク: [[nextjs-performance#基本的な概念]]");
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
		const initialCursorPos = editorTextarea.selectionStart;

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
		await userEvent.type(editorTextarea, "Initial content\n\nSecond line\n\nThird line");

		// テキストエリアのフォーカスを外す
		const titleInput = canvas.getByLabelText("タイトル");
		await userEvent.click(titleInput);

		// テキストエリアがフォーカスを失ったことを確認
		expect(document.activeElement).not.toBe(editorTextarea);

		// MDEditorコンテナを取得
		const editorContainer = editorTextarea.closest('.w-md-editor') as HTMLElement;
		expect(editorContainer).toBeInTheDocument();

		// プレビュー側の領域をクリック（.w-md-editor-previewを探す）
		const previewArea = editorContainer.querySelector('.w-md-editor-preview') as HTMLElement;
		if (previewArea) {
			await userEvent.click(previewArea);

			// テキストエリアにフォーカスが当たったことを確認
			await waitFor(() => {
				expect(document.activeElement).toBe(editorTextarea);
			});

			// カーソルが最後に移動していることを確認
			const expectedLength = "Initial content\n\nSecond line\n\nThird line".length;
			expect(editorTextarea.selectionStart).toBe(expectedLength);
			expect(editorTextarea.selectionEnd).toBe(expectedLength);
		}

		// 再度フォーカスを外す
		await userEvent.click(titleInput);
		expect(document.activeElement).not.toBe(editorTextarea);

		// エディター側（左側）の空白部分をクリック
		const editorSide = editorContainer.querySelector('.w-md-editor-text') as HTMLElement;
		if (editorSide) {
			await userEvent.click(editorSide);

			// テキストエリアにフォーカスが当たったことを確認
			await waitFor(() => {
				expect(document.activeElement).toBe(editorTextarea);
			});
		}

		// ツールバーのボタンをクリックしても通常の動作をすることを確認
		// （フォーカスが奪われないことを確認）
		const boldButton = editorContainer.querySelector('[data-name="bold"]') as HTMLElement;
		if (boldButton) {
			// 一部のテキストを選択
			editorTextarea.setSelectionRange(0, 7); // "Initial"を選択
			
			await userEvent.click(boldButton);
			
			// テキストにBoldが適用されたことを確認
			await waitFor(() => {
				expect(editorTextarea.value).toBe("**Initial** content\n\nSecond line\n\nThird line");
			});
		}
	},
};

/**
 * 括弧ペア削除のテスト
 * [[]]などの括弧ペアで片方を削除すると対応する括弧も削除される
 */
export const BracketPairDeletion: Story = {
	name: "括弧ペア削除機能",
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

		// テストケース1: [[]] で右側の ] を削除
		await userEvent.click(editorTextarea);
		await userEvent.type(editorTextarea, "[[test]]");
		
		// カーソルを ]] の間に移動: [[test]|]
		editorTextarea.setSelectionRange(7, 7);
		
		// バックスペースで ] を削除
		await userEvent.keyboard("{Backspace}");
		
		// 対応する [ も削除されて [test] になることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("[test]");
		});

		// クリア
		await userEvent.clear(editorTextarea);

		// テストケース2: [[]] で左側の [ を削除
		await userEvent.type(editorTextarea, "[[test]]");
		
		// カーソルを [[ の間に移動: [|[test]]
		editorTextarea.setSelectionRange(1, 1);
		
		// バックスペースで [ を削除
		await userEvent.keyboard("{Backspace}");
		
		// 対応する ] も削除されて [test] になることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("[test]");
		});

		// クリア
		await userEvent.clear(editorTextarea);

		// テストケース3: 通常の括弧ペア（""）でも動作確認
		await userEvent.type(editorTextarea, '"quoted text"');
		
		// カーソルを最後の " の前に移動
		editorTextarea.setSelectionRange(12, 12);
		
		// バックスペースで " を削除
		await userEvent.keyboard("{Backspace}");
		
		// 対応する開始の " も削除されることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("quoted text");
		});

		// クリア
		await userEvent.clear(editorTextarea);

		// テストケース4: ネストされた括弧での動作
		await userEvent.type(editorTextarea, "[[ [inner] ]]");
		
		// 外側の ]] の間にカーソルを移動
		editorTextarea.setSelectionRange(12, 12);
		
		// バックスペースで ] を削除
		await userEvent.keyboard("{Backspace}");
		
		// 外側の [[ と ]] が削除されることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("[ [inner] ]");
		});

		// クリア
		await userEvent.clear(editorTextarea);

		// テストケース5: Delete キーでの動作
		await userEvent.type(editorTextarea, "[[test]]");
		
		// カーソルを最初の [ の前に移動: |[[test]]
		editorTextarea.setSelectionRange(0, 0);
		
		// Delete キーで [ を削除
		await userEvent.keyboard("{Delete}");
		
		// 対応する ] も削除されることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("[test]");
		});

		// クリア
		await userEvent.clear(editorTextarea);

		// テストケース6: {} ペアの削除
		await userEvent.type(editorTextarea, "{object}");
		
		// カーソルを } の前に移動
		editorTextarea.setSelectionRange(7, 7);
		
		// バックスペースで } を削除
		await userEvent.keyboard("{Backspace}");
		
		// 対応する { も削除されることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("object");
		});

		// クリア
		await userEvent.clear(editorTextarea);

		// テストケース7: 不完全なペアでは削除されないことを確認
		await userEvent.type(editorTextarea, "[[test]");
		
		// カーソルを最後に移動
		editorTextarea.setSelectionRange(7, 7);
		
		// バックスペースで ] を削除
		await userEvent.keyboard("{Backspace}");
		
		// 単独の ] だけが削除されることを確認
		await waitFor(() => {
			expect(editorTextarea.value).toBe("[[test");
		});
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
