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
