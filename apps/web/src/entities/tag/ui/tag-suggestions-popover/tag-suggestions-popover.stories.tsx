import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, fn, within } from "@storybook/test";
import { HttpResponse, http } from "msw";

import type { TagSuggestionItem } from "./tag-suggestions-popover";
import { TagSuggestionsPopover } from "./tag-suggestions-popover";

const meta = {
	component: TagSuggestionsPopover,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
} satisfies Meta<typeof TagSuggestionsPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

// モックデータ
const mockTags: TagSuggestionItem[] = [
	{ id: 1, slug: "react", name: "React", usageCount: 15, type: "tag" },
	{
		id: 2,
		slug: "typescript",
		name: "TypeScript",
		usageCount: 12,
		type: "tag",
	},
	{ id: 3, slug: "nextjs", name: "Next.js", usageCount: 10, type: "tag" },
	{
		id: 4,
		slug: "programming",
		name: "プログラミング",
		usageCount: 8,
		type: "tag",
	},
	{
		id: 5,
		slug: "frontend",
		name: "フロントエンド",
		usageCount: 5,
		type: "tag",
	},
];

// 基本的なストーリー
export const Default: Story = {
	name: "デフォルト表示",
	tags: ["code-only"],
	args: {
		open: true,
		query: "",
		position: { top: 100, left: 100 },
		onOpenChange: fn(),
		onSelect: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/tags/suggestions", () => {
					return HttpResponse.json({
						suggestions: mockTags,
					});
				}),
			],
		},
	},
};

// クエリ付きのストーリー
export const WithQuery: Story = {
	name: "検索クエリあり",
	tags: ["code-only"],
	args: {
		open: true,
		query: "Re",
		position: { top: 100, left: 100 },
		onOpenChange: fn(),
		onSelect: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/tags/suggestions", ({ request }) => {
					const url = new URL(request.url);
					const query = url.searchParams.get("q");
					if (query === "Re") {
						return HttpResponse.json({
							suggestions: [mockTags[0]],
						});
					}
					return HttpResponse.json({
						suggestions: [],
					});
				}),
			],
		},
	},
};

// 空の状態
export const Empty: Story = {
	name: "タグが存在しない場合",
	tags: ["code-only"],
	args: {
		open: true,
		query: "",
		position: { top: 100, left: 100 },
		onOpenChange: fn(),
		onSelect: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/tags/suggestions", () => {
					return HttpResponse.json({
						suggestions: [],
					});
				}),
			],
		},
	},
};

// エラー状態
export const ErrorState: Story = {
	name: "API エラー時",
	tags: ["code-only"],
	args: {
		open: true,
		query: "",
		position: { top: 100, left: 100 },
		onOpenChange: fn(),
		onSelect: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/tags/suggestions", () => {
					return new HttpResponse(null, {
						status: 500,
						statusText: "Internal Server Error",
					});
				}),
			],
		},
	},
};

// キーボードナビゲーションのテスト
export const KeyboardNavigation: Story = {
	name: "キーボードナビゲーション（Ctrl+P/N）",
	tags: ["code-only", "!test"],
	args: {
		open: true,
		query: "",
		position: { top: 100, left: 100 },
		onOpenChange: fn(),
		onSelect: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/tags/suggestions", () => {
					return HttpResponse.json({
						suggestions: mockTags,
					});
				}),
			],
		},
	},
	play: async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: any;
	}) => {
		const canvas = within(canvasElement);

		// タグサジェストが表示されるのを待つ
		await canvas.findByText("React", {}, { timeout: 3000 });

		// テキストエリアを作成してフォーカス（キーボードイベントのターゲット用）
		const textarea = document.createElement("textarea");
		textarea.className = "w-md-editor-text-input";
		document.body.appendChild(textarea);
		textarea.focus();

		// 最初のアイテムが選択されていることを確認
		const firstItem = canvas.getByText("React").closest('[role="option"]');
		expect(firstItem).toHaveAttribute("data-selected", "true");

		// Ctrl+N で下に移動
		const downEvent = new KeyboardEvent("keydown", {
			key: "n",
			ctrlKey: true,
			bubbles: true,
		});
		window.dispatchEvent(downEvent);

		// 少し待つ
		await new Promise((resolve) => setTimeout(resolve, 100));

		// 2番目のアイテムが選択されていることを確認
		const secondItem = canvas
			.getByText("TypeScript")
			.closest('[role="option"]');
		expect(secondItem).toHaveAttribute("data-selected", "true");

		// Ctrl+P で上に移動
		const upEvent = new KeyboardEvent("keydown", {
			key: "p",
			ctrlKey: true,
			bubbles: true,
		});
		window.dispatchEvent(upEvent);

		// 少し待つ
		await new Promise((resolve) => setTimeout(resolve, 100));

		// 最初のアイテムが再度選択されていることを確認
		expect(firstItem).toHaveAttribute("data-selected", "true");

		// Enter キーで選択
		const enterEvent = new KeyboardEvent("keydown", {
			key: "Enter",
			bubbles: true,
		});
		window.dispatchEvent(enterEvent);

		// onSelect が呼ばれたことを確認
		expect(args.onSelect).toHaveBeenCalledWith(mockTags[0]);

		// クリーンアップ
		document.body.removeChild(textarea);
	},
};

// 選択動作のテスト
export const SelectionBehavior: Story = {
	name: "タグ選択動作",
	tags: ["code-only", "!test"],
	args: {
		open: true,
		query: "",
		position: { top: 100, left: 100 },
		onOpenChange: fn(),
		onSelect: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/tags/suggestions", () => {
					return HttpResponse.json({
						suggestions: mockTags,
					});
				}),
			],
		},
	},
	play: async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: any;
	}) => {
		const canvas = within(canvasElement);

		// タグサジェストが表示されるのを待つ
		await canvas.findByText("React", {}, { timeout: 3000 });

		// タグをクリックして選択
		const reactTag = canvas.getByText("React").closest('[role="option"]');
		if (reactTag instanceof HTMLElement) {
			await reactTag.click();
		}

		// onSelect が呼ばれたことを確認
		expect(args.onSelect).toHaveBeenCalledWith(mockTags[0]);
	},
};

// Escape キーでの閉じる動作
export const EscapeKey: Story = {
	name: "Escape キーで閉じる",
	tags: ["code-only", "!test"],
	args: {
		open: true,
		query: "",
		position: { top: 100, left: 100 },
		onOpenChange: fn(),
		onSelect: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/tags/suggestions", () => {
					return HttpResponse.json({
						suggestions: mockTags,
					});
				}),
			],
		},
	},
	play: async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: any;
	}) => {
		const canvas = within(canvasElement);

		// タグサジェストが表示されるのを待つ
		await canvas.findByText("React", {}, { timeout: 3000 });

		// Escape キーを押す
		const escapeEvent = new KeyboardEvent("keydown", {
			key: "Escape",
			bubbles: true,
		});
		window.dispatchEvent(escapeEvent);

		// onOpenChange が false で呼ばれたことを確認
		expect(args.onOpenChange).toHaveBeenCalledWith(false);
	},
};

// 日本語タグのテスト
export const JapaneseTags: Story = {
	name: "日本語タグの表示",
	tags: ["code-only"],
	args: {
		open: true,
		query: "プロ",
		position: { top: 100, left: 100 },
		onOpenChange: fn(),
		onSelect: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/tags/suggestions", ({ request }) => {
					const url = new URL(request.url);
					const query = url.searchParams.get("q");
					if (query === "プロ") {
						return HttpResponse.json({
							suggestions: [mockTags[3]],
						});
					}
					return HttpResponse.json({
						suggestions: [],
					});
				}),
			],
		},
	},
};

// 使用回数の表示テスト
export const UsageCount: Story = {
	name: "使用回数の表示",
	tags: ["code-only", "!test"],
	args: {
		open: true,
		query: "",
		position: { top: 100, left: 100 },
		onOpenChange: fn(),
		onSelect: fn(),
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/tags/suggestions", () => {
					return HttpResponse.json({
						suggestions: mockTags,
					});
				}),
			],
		},
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// タグサジェストが表示されるのを待つ
		await canvas.findByText("React", {}, { timeout: 3000 });

		// 使用回数が表示されていることを確認
		expect(canvas.getByText("15件")).toBeInTheDocument();
		expect(canvas.getByText("12件")).toBeInTheDocument();
		expect(canvas.getByText("10件")).toBeInTheDocument();
		expect(canvas.getByText("8件")).toBeInTheDocument();
		expect(canvas.getByText("5件")).toBeInTheDocument();
	},
};
