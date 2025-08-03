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
 * 基本的なフォーム表示
 */
export const BasicForm: Story = {
	name: "基本的なフォーム表示",
	tags: ["code-only"],
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
