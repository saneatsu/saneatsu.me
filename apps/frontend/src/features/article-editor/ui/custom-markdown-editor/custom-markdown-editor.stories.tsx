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
