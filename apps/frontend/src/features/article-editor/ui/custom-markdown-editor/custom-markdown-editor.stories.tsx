import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

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
