import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import type { ArticleStatus } from "@/shared/model";

import { ArticleStatusSelector } from "./article-status-selector";

const meta: Meta<typeof ArticleStatusSelector> = {
	component: ArticleStatusSelector,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
	decorators: [
		(Story) => (
			<div className="p-4">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Storybookで状態管理するためのラッパーコンポーネント
 */
function ArticleStatusSelectorWrapper({
	initialValue,
	statuses,
	error,
	label,
	required,
	onValueChange,
}: {
	initialValue: ArticleStatus;
	statuses: ReadonlyArray<ArticleStatus>;
	error?: string;
	label?: string;
	required?: boolean;
	onValueChange?: (value: ArticleStatus) => void;
}) {
	const [value, setValue] = useState<ArticleStatus>(initialValue);

	const handleChange = (newValue: ArticleStatus) => {
		setValue(newValue);
		onValueChange?.(newValue);
	};

	return (
		<ArticleStatusSelector
			value={value}
			onValueChange={handleChange}
			statuses={statuses}
			error={error}
			label={label}
			required={required}
		/>
	);
}

/**
 * デフォルト状態 (新規作成フォーム用)
 */
export const ForNewArticle: Story = {
	name: "デフォルト状態（draft/published）",
	tags: ["code-only"],
	render: () => (
		<ArticleStatusSelectorWrapper
			initialValue="draft"
			statuses={["draft", "published"]}
			label="公開ステータス"
			required
		/>
	),
};

/**
 * 編集フォーム用（全ステータス）
 */
export const ForEditing: Story = {
	name: "編集フォーム（全ステータス）",
	tags: ["code-only"],
	render: () => (
		<ArticleStatusSelectorWrapper
			initialValue="published"
			statuses={["draft", "published", "archived"]}
			label="ステータス"
			required
		/>
	),
};

/**
 * エラー表示
 */
export const ErrorDisplay: Story = {
	name: "エラー表示",
	tags: ["code-only"],
	render: () => (
		<ArticleStatusSelectorWrapper
			initialValue="draft"
			statuses={["draft", "published"]}
			label="公開ステータス"
			required
			error="ステータスを選択してください"
		/>
	),
};

/**
 * ステータス選択のインタラクション
 */
export const StatusSelectionInteraction: Story = {
	name: "ステータス選択インタラクション",
	tags: ["validation"],
	render: () => {
		const onValueChange = fn();
		return (
			<ArticleStatusSelectorWrapper
				initialValue="draft"
				statuses={["draft", "published", "archived"]}
				label="ステータス"
				required
				onValueChange={onValueChange}
			/>
		);
	},
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Publishedを選択
		const publishedLabel = canvas.getByText("公開済み");
		await userEvent.click(publishedLabel);
		await expect(canvas.getByRole("radio", { name: "公開済み" })).toBeChecked();

		// Archivedを選択
		const archivedLabel = canvas.getByText("アーカイブ");
		await userEvent.click(archivedLabel);
		await expect(
			canvas.getByRole("radio", { name: "アーカイブ" })
		).toBeChecked();

		// Draftを選択
		const draftLabel = canvas.getByText("下書き");
		await userEvent.click(draftLabel);
		await expect(canvas.getByRole("radio", { name: "下書き" })).toBeChecked();
	},
};
