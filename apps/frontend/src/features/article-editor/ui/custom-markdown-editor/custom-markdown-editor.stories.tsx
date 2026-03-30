import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { CustomMarkdownEditor } from "./custom-markdown-editor";

const meta: Meta<typeof CustomMarkdownEditor> = {
	component: CustomMarkdownEditor,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;

type Story = StoryObj<typeof CustomMarkdownEditor>;

/**
 * デフォルトのストーリー
 *
 * 基本的なMarkdownエディタの動作を確認
 */
export const Default: Story = {
	name: "デフォルト",
	tags: ["code-only"],
	render: () => {
		const [value, setValue] = useState("# Hello, World!\n\nこれはテストです。");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={600}
				/>
			</div>
		);
	},
};

/**
 * 空の状態
 */
export const Empty: Story = {
	name: "空の状態",
	tags: ["code-only"],
	render: () => {
		const [value, setValue] = useState("");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={600}
				/>
			</div>
		);
	},
};

/**
 * 長いコンテンツ
 */
export const LongContent: Story = {
	name: "長いコンテンツ",
	tags: ["code-only"],
	render: () => {
		const [value, setValue] = useState(`# Markdownエディタのテスト

## 見出し2

これは段落です。

### 見出し3

- 箇条書き1
- 箇条書き2
- 箇条書き3

#### 見出し4

1. 番号付きリスト1
2. 番号付きリスト2
3. 番号付きリスト3

##### 見出し5

**Bold** *Italic* ~~Strikethrough~~

\`\`\`typescript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

###### 見出し6

> 引用

---

[リンク](https://example.com)

![画像](https://via.placeholder.com/150)
`);

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={600}
				/>
			</div>
		);
	},
};

/**
 * 括弧自動補完のテスト
 */
export const BracketAutoCompletion: Story = {
	name: "括弧自動補完",
	render: () => {
		const [value, setValue] = useState("");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// Test bracket auto-completion
		await userEvent.keyboard("{[}");
		await waitFor(() => expect(textarea.value).toBe("[]"));

		// Test Wiki Link auto-completion
		// カーソルは自動的に [] の間にあるので、もう一度 [ を入力
		await userEvent.keyboard("{[}");
		await waitFor(() => expect(textarea.value).toBe("[[]]"));
	},
};

/**
 * Wiki Link自動補完のテスト
 */
export const WikiLinkAutoCompletion: Story = {
	name: "Wiki Link自動補完",
	render: () => {
		const [value, setValue] = useState("");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// Test Wiki Link auto-completion: [[ → [[]]
		await userEvent.keyboard("{[}{[}");
		await waitFor(() => expect(textarea.value).toBe("[[]]"));
		expect(textarea.selectionStart).toBe(2);
		expect(textarea.selectionEnd).toBe(2);
	},
};

/**
 * 単一括弧自動補完のテスト
 */
export const SingleBracketAutoCompletion: Story = {
	name: "単一括弧自動補完",
	render: () => {
		const [value, setValue] = useState("");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// Test: [ → []
		await userEvent.keyboard("{[}");
		await waitFor(() => expect(textarea.value).toBe("[]"));
		expect(textarea.selectionStart).toBe(1);
		expect(textarea.selectionEnd).toBe(1);
	},
};

/**
 * Wiki Linkペア削除（Backspace）のテスト
 */
export const WikiLinkPairDeletionBackspace: Story = {
	name: "Wiki Linkペア削除（Backspace）",
	render: () => {
		const [value, setValue] = useState("[[]]");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// カーソルを最初の [ と 2つ目の [ の間に配置 (position 1)
		textarea.setSelectionRange(1, 1);
		textarea.focus();

		// Backspaceで [[]] → []
		await userEvent.keyboard("{Backspace}");
		await waitFor(() => expect(textarea.value).toBe("[]"));
	},
};

/**
 * Wiki Linkペア削除（Ctrl+H）のテスト
 */
export const WikiLinkPairDeletionCtrlH: Story = {
	name: "Wiki Linkペア削除（Ctrl+H）",
	render: () => {
		const [value, setValue] = useState("[[]]");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// カーソルを最初の [ と 2つ目の [ の間に配置 (position 1)
		textarea.setSelectionRange(1, 1);
		textarea.focus();

		// Ctrl+Hで [[]] → []
		await userEvent.keyboard("{Control>}h{/Control}");
		await waitFor(() => expect(textarea.value).toBe("[]"));
	},
};

/**
 * 括弧ペア削除（Backspace）のテスト
 */
export const BracketPairDeletionBackspace: Story = {
	name: "括弧ペア削除（Backspace）",
	render: () => {
		const [value, setValue] = useState("[]");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// カーソルを括弧の間に配置
		textarea.setSelectionRange(1, 1);
		textarea.focus();

		// Backspaceで両方の括弧が削除されることを確認
		await userEvent.keyboard("{Backspace}");
		expect(textarea.value).toBe("");
	},
};

/**
 * 括弧ペア削除（Delete）のテスト
 */
export const BracketPairDeletionDelete: Story = {
	name: "括弧ペア削除（Delete）",
	render: () => {
		const [value, setValue] = useState("()");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// カーソルを括弧の間に配置
		textarea.setSelectionRange(1, 1);
		textarea.focus();

		// Deleteで両方の括弧が削除されることを確認
		await userEvent.keyboard("{Delete}");
		expect(textarea.value).toBe("");
	},
};

/**
 * リスト自動継続（箇条書き）のテスト
 */
export const ListAutoContinuationBullet: Story = {
	name: "リスト自動継続（箇条書き）",
	render: () => {
		const [value, setValue] = useState("- First item");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// カーソルを末尾に配置
		textarea.setSelectionRange(12, 12);
		textarea.focus();

		// Enterで新しいリスト項目が作成されることを確認
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(textarea.value).toBe("- First item\n- "));
	},
};

/**
 * リスト自動継続（番号付きリスト）のテスト
 */
export const ListAutoContinuationOrdered: Story = {
	name: "リスト自動継続（番号付きリスト）",
	render: () => {
		const [value, setValue] = useState("1. First item");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// カーソルを末尾に配置
		textarea.setSelectionRange(13, 13);
		textarea.focus();

		// Enterで番号がインクリメントされたリスト項目が作成されることを確認
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(textarea.value).toBe("1. First item\n2. "));
	},
};

/**
 * リスト自動継続（チェックボックス）のテスト
 */
export const ListAutoContinuationCheckbox: Story = {
	name: "リスト自動継続（チェックボックス）",
	render: () => {
		const [value, setValue] = useState("- [ ] Task");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// カーソルを末尾に配置
		textarea.setSelectionRange(11, 11);
		textarea.focus();

		// Enterで新しい未チェックボックスが作成されることを確認
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(textarea.value).toBe("- [ ] Task\n- [ ] "));
	},
};

/**
 * リスト自動継続（空のリスト項目）のテスト
 */
export const ListAutoContinuationExitList: Story = {
	name: "リスト自動継続（空のリスト項目で抜ける）",
	render: () => {
		const [value, setValue] = useState("- ");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// カーソルを末尾に配置
		textarea.setSelectionRange(2, 2);
		textarea.focus();

		// Enterでリストから抜けることを確認
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(textarea.value).toBe(""));
	},
};

/**
 * 画像アップロード機能のデモ
 *
 * 以下の3つの方法で画像をアップロードできます：
 * 1. クリップボードから画像をペースト（Ctrl+V / Cmd+V）
 * 2. 画像ファイルをドラッグ&ドロップ
 * 3. テキストエリアを右クリック → 「画像をアップロード」を選択
 *
 * 注意：実際の画像アップロードAPIはモックされています
 */
export const ImageUploadDemo: Story = {
	name: "画像アップロード機能（デモ）",
	tags: ["code-only"],
	render: () => {
		const [value, setValue] = useState(
			"# 画像アップロードのテスト\n\n以下の方法で画像をアップロードできます：\n\n1. 画像をクリップボードにコピーして、エディタにペースト（Ctrl+V / Cmd+V）\n2. 画像ファイルをエディタにドラッグ&ドロップ\n3. エディタを右クリック → 「画像をアップロード」を選択\n\n"
		);

		return (
			<div className="p-4">
				<div className="mb-4 p-4 border border-blue-500 bg-blue-50 rounded">
					<h3 className="font-bold mb-2">使い方：</h3>
					<ul className="list-disc list-inside space-y-1 text-sm">
						<li>
							<strong>ペースト：</strong>
							画像をクリップボードにコピーして、エディタ上で Ctrl+V（Mac:
							Cmd+V）
						</li>
						<li>
							<strong>ドラッグ&ドロップ：</strong>
							画像ファイルをエディタにドラッグ&ドロップ
						</li>
						<li>
							<strong>ファイル選択：</strong>
							エディタを右クリック → 「画像をアップロード」を選択
						</li>
					</ul>
					<p className="mt-2 text-sm text-gray-600">
						※
						実際の画像アップロードAPIはモックされているため、プレースホルダーURLが挿入されます
					</p>
				</div>
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={600}
				/>
			</div>
		);
	},
};

/**
 * 画像ペーストのデモ
 */
export const PasteImageDemo: Story = {
	name: "画像ペースト（Ctrl+V）のデモ",
	tags: ["code-only"],
	render: () => {
		const [value, setValue] = useState(
			"# 画像ペーストのテスト\n\n画像をクリップボードにコピーして、このエディタ上でペースト（Ctrl+V / Cmd+V）してください。\n\n"
		);

		return (
			<div className="p-4">
				<div className="mb-4 p-4 border border-green-500 bg-green-50 rounded">
					<h3 className="font-bold mb-2">テスト手順：</h3>
					<ol className="list-decimal list-inside space-y-1 text-sm">
						<li>画像ファイルをコピー、またはスクリーンショットを撮る</li>
						<li>エディタをクリックしてフォーカスする</li>
						<li>Ctrl+V（Mac: Cmd+V）でペースト</li>
						<li>プレビューに画像Markdownが表示されることを確認</li>
					</ol>
				</div>
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={600}
				/>
			</div>
		);
	},
};

/**
 * ドラッグ&ドロップのデモ
 */
export const DragDropImageDemo: Story = {
	name: "画像ドラッグ&ドロップのデモ",
	tags: ["code-only"],
	render: () => {
		const [value, setValue] = useState(
			"# 画像ドラッグ&ドロップのテスト\n\n画像ファイルをこのエディタにドラッグ&ドロップしてください。\n\n"
		);

		return (
			<div className="p-4">
				<div className="mb-4 p-4 border border-purple-500 bg-purple-50 rounded">
					<h3 className="font-bold mb-2">テスト手順：</h3>
					<ol className="list-decimal list-inside space-y-1 text-sm">
						<li>ローカルの画像ファイルを選択</li>
						<li>エディタ領域にドラッグ&ドロップ</li>
						<li>プレビューに画像Markdownが表示されることを確認</li>
					</ol>
					<p className="mt-2 text-sm text-gray-600">
						※ 対応形式: PNG, JPG, GIF, WebP など
					</p>
				</div>
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={600}
				/>
			</div>
		);
	},
};

/**
 * Context Menuからのファイル選択のデモ
 */
export const ContextMenuUploadDemo: Story = {
	name: "Context Menuからの画像アップロードのデモ",
	tags: ["code-only"],
	render: () => {
		const [value, setValue] = useState(
			"# Context Menuからの画像アップロード\n\nエディタを右クリックして「画像をアップロード」を選択してください。\n\n"
		);

		return (
			<div className="p-4">
				<div className="mb-4 p-4 border border-orange-500 bg-orange-50 rounded">
					<h3 className="font-bold mb-2">テスト手順：</h3>
					<ol className="list-decimal list-inside space-y-1 text-sm">
						<li>エディタ領域を右クリック</li>
						<li>「画像をアップロード」メニュー項目を選択</li>
						<li>ファイル選択ダイアログから画像を選択</li>
						<li>プレビューに画像Markdownが表示されることを確認</li>
					</ol>
				</div>
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={600}
				/>
			</div>
		);
	},
};

/**
 * クリック領域拡張機能のデモ
 *
 * エディタコンテナの空白部分をクリックすると、
 * 自動的にtextareaにフォーカスしてカーソルが最後に移動します。
 */
export const ClickExpansionDemo: Story = {
	name: "クリック領域拡張のデモ",
	tags: ["code-only"],
	render: () => {
		const [value, setValue] = useState(
			"# クリック領域拡張のテスト\n\nエディタの空白部分（border周辺など）をクリックしてください。\n\n自動的にtextareaにフォーカスして、カーソルが最後に移動します。\n"
		);

		return (
			<div className="p-4">
				<div className="mb-4 p-4 border border-indigo-500 bg-indigo-50 rounded">
					<h3 className="font-bold mb-2">テスト手順：</h3>
					<ol className="list-decimal list-inside space-y-1 text-sm">
						<li>エディタコンテナの空白部分（border周辺など）をクリック</li>
						<li>
							textareaに自動的にフォーカスされ、カーソルが最後に移動することを確認
						</li>
						<li>
							textarea自体をクリックした場合は、通常通りクリックした位置にカーソルが移動することを確認
						</li>
					</ol>
					<p className="mt-2 text-sm text-gray-600">
						※
						この機能により、エディタ全体がクリック可能な領域となり、UXが向上します
					</p>
				</div>
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={600}
				/>
			</div>
		);
	},
};

/**
 * IME入力中のクリック領域拡張機能のテスト
 *
 * IME入力中（日本語入力中）にクリックイベントが発火しても、
 * カーソルが移動しないことを確認します。
 */
export const IMEInputClickExpansion: Story = {
	name: "IME入力中のクリック領域拡張",
	render: () => {
		const [value, setValue] = useState("テスト");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);

		// カーソルを途中に配置（「テ」の後ろ、position 1）
		textarea.setSelectionRange(1, 1);
		textarea.focus();

		// 現在のカーソル位置を保存
		const initialCursorPos = textarea.selectionStart;
		expect(initialCursorPos).toBe(1);

		// IME入力開始イベントをディスパッチ
		const compositionStartEvent = new CompositionEvent("compositionstart", {
			bubbles: true,
			cancelable: true,
		});
		textarea.dispatchEvent(compositionStartEvent);

		// エディタコンテナを取得
		const editorContainer = textarea.closest(".border");
		expect(editorContainer).not.toBeNull();

		// IME入力中にエディタコンテナをクリック
		if (editorContainer) {
			await userEvent.click(editorContainer as HTMLElement);
		}

		// カーソル位置が移動していないことを確認（IME入力中は無視される）
		await waitFor(() => {
			expect(textarea.selectionStart).toBe(initialCursorPos);
			expect(textarea.selectionEnd).toBe(initialCursorPos);
		});

		// IME入力終了イベントをディスパッチ
		const compositionEndEvent = new CompositionEvent("compositionend", {
			bubbles: true,
			cancelable: true,
		});
		textarea.dispatchEvent(compositionEndEvent);

		// カーソルを再度途中に配置
		textarea.setSelectionRange(1, 1);
		textarea.focus();

		// IME入力終了後にエディタコンテナをクリック
		if (editorContainer) {
			await userEvent.click(editorContainer as HTMLElement);
		}

		// カーソルが最後に移動していることを確認（IME入力終了後は正常動作）
		await waitFor(() => {
			expect(textarea.selectionStart).toBe(textarea.value.length);
			expect(textarea.selectionEnd).toBe(textarea.value.length);
		});
	},
};

/**
 * IME入力中の括弧自動補完
 *
 * @description
 * IME入力中（日本語入力中）に括弧キーを押しても、
 * 自動補完が実行されないことを確認します。
 * また、IME入力終了後は正常に括弧補完が動作することを確認します。
 */
export const IMEInputBracketCompletion: Story = {
	name: "IME入力中の括弧自動補完",
	render: () => {
		const [value, setValue] = useState("");

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// Wait for textarea to be ready
		await userEvent.click(textarea);
		textarea.focus();

		// 初期状態を確認
		expect(textarea.value).toBe("");

		// IME入力開始イベントをディスパッチ
		const compositionStartEvent = new CompositionEvent("compositionstart", {
			bubbles: true,
			cancelable: true,
		});
		textarea.dispatchEvent(compositionStartEvent);

		// IME入力中に [ キーを押す（「を入力しようとしている）
		const keydownEventDuringIME = new KeyboardEvent("keydown", {
			key: "Process",
			bubbles: true,
			cancelable: true,
		});
		window.dispatchEvent(keydownEventDuringIME);

		// 少し待機
		await new Promise((resolve) => setTimeout(resolve, 100));

		// 値が変わっていないことを確認（自動補完されていない）
		await waitFor(() => {
			// IME入力中は自動補完が実行されないため、値は空のまま
			expect(textarea.value).toBe("");
		});

		// IME入力終了イベントをディスパッチ
		const compositionEndEvent = new CompositionEvent("compositionend", {
			bubbles: true,
			cancelable: true,
		});
		textarea.dispatchEvent(compositionEndEvent);

		// IME入力終了後に [ キーを押す
		await userEvent.keyboard("{[}");

		// 少し待機
		await new Promise((resolve) => setTimeout(resolve, 100));

		// 自動補完が実行されて [] になっていることを確認
		await waitFor(() => {
			expect(textarea.value).toBe("[]");
		});

		// カーソルが括弧の間にあることを確認
		await waitFor(() => {
			expect(textarea.selectionStart).toBe(1);
			expect(textarea.selectionEnd).toBe(1);
		});
	},
};

/**
 * スクロール同期テスト用のMarkdownコンテンツ
 *
 * @description
 * 見出し・画像・Amazon埋め込みなどプレビュー側の高さが大きくなる要素を含む。
 * ユーザーが提示した実際の記事コンテンツに基づく。
 */
const scrollSyncTestMarkdown = `### ものは基本的に外に出さない

これが一番大事。

### ものを買わない

例えば

カップボードが備え付けであるし、大きめのSIC/WICが備え付けのところにした。

炭酸水を作れるやつとかあるがあの類のものも自分は買わないほうが良いと思った。
最初だけしか使わない。


因みにジモティーでは10点ほど出品し、残った8点ほどは粗大ごみを出したが6,000円もかかっている。

### 一定期間不要になったものは積極的に捨てる

ジモティーにガンガン放出してしまった方が良い。

### 消耗品は勿体ぶらないでガンガン使う

もらったものとか、単価が高いものを買った場合もったいぶって使わない、ないし使うのをかなりケチる傾向にある。

香水

### 床のケアをちゃんとする

次の家ではフロアタイルを敷くことにした。
多くのものが3〜5mm程度の厚さがあるが、これは2.5mmと薄め。つまり重量が軽い。
またお試しセットを100円程度で取り寄せて数週間貼ってみたが何度もはがせるしベタつかなさそうでかなり感触は良かった。

色はかなり悩んだが、不動産のサイトで自分の部屋の画像をダウンロードしてきてAIに床に貼らせて一番良さげなものを選んだ。

https://amzn.to/4uJgJKv


### スリッパは履かない




### 長く愛着を持てるものを買う

例えば爪切りとかは今まで100均の適当なものを使っていたが1,600円くらいするものを買ってみた。


## その他

### バスタオルはミニバスタオルサイズ（100x50cm）が良い

![image](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/saneatsu-me_content_750ba7a6-bd8b-44ee-9e78-a64ec5550b60/original)

ref: [タオル研究所](https://amzn.to/4sVYiAA)

バスタオルのサイズは大きいため収納、洗濯機の幅を撮ってしまう。

夏は朝ジム行ってシャワー浴びて、夜もお風呂に入ることもあるので数も確保しておきたい。


https://amzn.to/40NBkQ7`;

/**
 * スクロール同期テスト: 見出しの対応位置が正しいことを検証
 *
 * @description
 * textareaを特定の見出し位置までスクロールしたとき、
 * プレビュー側でも対応する見出しが表示されていることを確認する。
 * 画像やAmazon埋め込みでプレビュー側の高さが大きくなる場合でも、
 * アンカーマッピングによる補間で正しく同期される。
 */
export const ScrollSyncHeadingAlignment: Story = {
	name: "スクロール同期: 見出し位置の対応",
	tags: ["validation"],
	render: () => {
		const [value, setValue] = useState(scrollSyncTestMarkdown);

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Given: エディタとプレビューが表示されている
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		// プレビューコンテナを取得（overflow-y-autoが設定されているdiv）
		const previewContainer = canvasElement.querySelector(
			".overflow-y-auto"
		) as HTMLDivElement;
		expect(previewContainer).toBeTruthy();

		// DOMレンダリングとマッピング構築を待つ
		await new Promise((resolve) => setTimeout(resolve, 500));

		// 「床のケアをちゃんとする」の行番号を計算（Markdownソース内）
		const lines = scrollSyncTestMarkdown.split("\n");
		const targetLineIndex = lines.findIndex((line) =>
			line.includes("### 床のケアをちゃんとする")
		);
		expect(targetLineIndex).toBeGreaterThan(0);

		// When: textareaを「床のケアをちゃんとする」の位置までスクロール
		const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight);
		const paddingTop = Number.parseFloat(getComputedStyle(textarea).paddingTop);
		const targetScrollTop = paddingTop + targetLineIndex * lineHeight;

		textarea.scrollTop = targetScrollTop;
		textarea.dispatchEvent(new Event("scroll"));

		// スクロール同期のrequestAnimationFrameを待つ
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Then: プレビュー側で「床のケアをちゃんとする」の見出しが表示範囲内にあることを確認
		const targetHeading = previewContainer.querySelector(
			`#${CSS.escape("床のケアをちゃんとする")}`
		) as HTMLElement;
		expect(targetHeading).toBeTruthy();

		const headingTop = targetHeading.offsetTop - previewContainer.offsetTop;
		const visibleTop = previewContainer.scrollTop;
		const visibleBottom =
			previewContainer.scrollTop + previewContainer.clientHeight;

		// 見出しがプレビューの表示範囲内にあること
		expect(headingTop).toBeGreaterThanOrEqual(visibleTop - 50);
		expect(headingTop).toBeLessThanOrEqual(visibleBottom);
	},
};

/**
 * スクロール同期テスト: 末尾の見出しの対応位置が正しいことを検証
 *
 * @description
 * textareaを末尾近くの「バスタオルはミニバスタオルサイズ」までスクロールしたとき、
 * プレビュー側でも対応する見出しが表示範囲内にあることを確認する。
 * 画像埋め込み後の見出しなので、プレビュー側の高さオフセットが大きい。
 */
export const ScrollSyncBottomHeadingAlignment: Story = {
	name: "スクロール同期: 末尾見出しの対応",
	tags: ["validation"],
	render: () => {
		const [value, setValue] = useState(scrollSyncTestMarkdown);

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Given: エディタとプレビューが表示されている
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		const previewContainer = canvasElement.querySelector(
			".overflow-y-auto"
		) as HTMLDivElement;
		expect(previewContainer).toBeTruthy();

		// DOMレンダリングとマッピング構築を待つ
		await new Promise((resolve) => setTimeout(resolve, 500));

		// 「## その他」の行番号を計算
		const lines = scrollSyncTestMarkdown.split("\n");
		const targetLineIndex = lines.findIndex((line) =>
			line.includes("## その他")
		);
		expect(targetLineIndex).toBeGreaterThan(0);

		// When: textareaを「## その他」の位置までスクロール
		const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight);
		const paddingTop = Number.parseFloat(getComputedStyle(textarea).paddingTop);
		const targetScrollTop = paddingTop + targetLineIndex * lineHeight;

		textarea.scrollTop = targetScrollTop;
		textarea.dispatchEvent(new Event("scroll"));

		// スクロール同期のrequestAnimationFrameを待つ
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Then: プレビュー側で「その他」の見出しが表示範囲内にあることを確認
		const targetHeading = previewContainer.querySelector(
			`#${CSS.escape("その他")}`
		) as HTMLElement;
		expect(targetHeading).toBeTruthy();

		const headingTop = targetHeading.offsetTop - previewContainer.offsetTop;
		const visibleTop = previewContainer.scrollTop;
		const visibleBottom =
			previewContainer.scrollTop + previewContainer.clientHeight;

		// 見出しがプレビューの表示範囲内にあること
		expect(headingTop).toBeGreaterThanOrEqual(visibleTop - 50);
		expect(headingTop).toBeLessThanOrEqual(visibleBottom);
	},
};

/**
 * スクロール同期テスト: 先頭位置の対応が正しいことを検証
 *
 * @description
 * textareaが先頭にある場合、プレビューも先頭にあることを確認する。
 */
export const ScrollSyncTopAlignment: Story = {
	name: "スクロール同期: 先頭位置の対応",
	tags: ["validation"],
	render: () => {
		const [value, setValue] = useState(scrollSyncTestMarkdown);

		return (
			<div className="p-4">
				<CustomMarkdownEditor
					value={value}
					onChange={setValue}
					setValue={(_, val) => setValue(val)}
					height={400}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Given: エディタとプレビューが表示されている
		const textarea = canvas.getByRole("textbox", {
			name: /markdown editor/i,
		}) as HTMLTextAreaElement;

		const previewContainer = canvasElement.querySelector(
			".overflow-y-auto"
		) as HTMLDivElement;
		expect(previewContainer).toBeTruthy();

		// DOMレンダリングとマッピング構築を待つ
		await new Promise((resolve) => setTimeout(resolve, 500));

		// When: textareaが先頭にある
		textarea.scrollTop = 0;
		textarea.dispatchEvent(new Event("scroll"));
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Then: プレビューも先頭にある
		expect(previewContainer.scrollTop).toBeLessThanOrEqual(5);
	},
};
