import type { Meta, StoryObj } from "@storybook/nextjs";
import {
	AlertCircle,
	AlertOctagon,
	AlertTriangle,
	CheckCircle2,
	Info,
} from "lucide-react";
import { expect, within } from "storybook/test";

import {
	MarkdownAlert,
	MarkdownAlertDescription,
	MarkdownAlertTitle,
} from "./markdown-alert";

const meta = {
	component: MarkdownAlert,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
	decorators: [
		(Story) => (
			<div className="p-4 max-w-2xl">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof MarkdownAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルトvariant（グレー）のAlert
 */
export const Default: Story = {
	name: "デフォルト（NOTE）",
	args: {
		variant: "default",
	},
	render: (args) => (
		<MarkdownAlert {...args}>
			<AlertCircle />
			<MarkdownAlertTitle>Note</MarkdownAlertTitle>
			<MarkdownAlertDescription>
				<p>これは通常のメモなのだ。重要な情報を強調表示するために使うのだ。</p>
			</MarkdownAlertDescription>
		</MarkdownAlert>
	),
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// タイトルが表示されていることを確認
		const title = canvas.getByText("Note");
		expect(title).toBeInTheDocument();

		// 説明文が表示されていることを確認
		const description = canvas.getByText(
			/これは通常のメモなのだ。重要な情報を強調表示するために使うのだ。/
		);
		expect(description).toBeInTheDocument();

		// アイコンが表示されていることを確認
		const alert = canvas.getByRole("alert");
		expect(alert).toBeInTheDocument();
	},
};

/**
 * infovariant（青）のAlert
 */
export const InfoVariant: Story = {
	name: "Info（青）",
	args: {
		variant: "info",
	},
	render: (args) => (
		<MarkdownAlert {...args}>
			<Info />
			<MarkdownAlertTitle>Info</MarkdownAlertTitle>
			<MarkdownAlertDescription>
				<p>これは情報を示すAlertなのだ。ユーザーに追加情報を提供するのだ。</p>
			</MarkdownAlertDescription>
		</MarkdownAlert>
	),
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const title = canvas.getByText("Info");
		expect(title).toBeInTheDocument();

		const description = canvas.getByText(
			/これは情報を示すAlertなのだ。ユーザーに追加情報を提供するのだ。/
		);
		expect(description).toBeInTheDocument();
	},
};

/**
 * successvariant（緑）のAlert
 */
export const SuccessVariant: Story = {
	name: "Success（緑）",
	args: {
		variant: "success",
	},
	render: (args) => (
		<MarkdownAlert {...args}>
			<CheckCircle2 />
			<MarkdownAlertTitle>Success</MarkdownAlertTitle>
			<MarkdownAlertDescription>
				<p>
					これは成功を示すAlertなのだ。操作が正常に完了したことを伝えるのだ。
				</p>
			</MarkdownAlertDescription>
		</MarkdownAlert>
	),
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const title = canvas.getByText("Success");
		expect(title).toBeInTheDocument();

		const description = canvas.getByText(
			/これは成功を示すAlertなのだ。操作が正常に完了したことを伝えるのだ。/
		);
		expect(description).toBeInTheDocument();
	},
};

/**
 * warningvariant（黄色）のAlert
 */
export const WarningVariant: Story = {
	name: "Warning（黄色）",
	args: {
		variant: "warning",
	},
	render: (args) => (
		<MarkdownAlert {...args}>
			<AlertTriangle />
			<MarkdownAlertTitle>Warning</MarkdownAlertTitle>
			<MarkdownAlertDescription>
				<p>これは警告を示すAlertなのだ。注意が必要な情報を伝えるのだ。</p>
			</MarkdownAlertDescription>
		</MarkdownAlert>
	),
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const title = canvas.getByText("Warning");
		expect(title).toBeInTheDocument();

		const description = canvas.getByText(
			/これは警告を示すAlertなのだ。注意が必要な情報を伝えるのだ。/
		);
		expect(description).toBeInTheDocument();
	},
};

/**
 * destructivevariant（赤）のAlert
 */
export const DestructiveVariant: Story = {
	name: "Destructive（赤）",
	args: {
		variant: "destructive",
	},
	render: (args) => (
		<MarkdownAlert {...args}>
			<AlertOctagon />
			<MarkdownAlertTitle>Danger</MarkdownAlertTitle>
			<MarkdownAlertDescription>
				<p>
					これは危険を示すAlertなのだ。重大なエラーや危険な操作を警告するのだ。
				</p>
			</MarkdownAlertDescription>
		</MarkdownAlert>
	),
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const title = canvas.getByText("Danger");
		expect(title).toBeInTheDocument();

		const description = canvas.getByText(
			/これは危険を示すAlertなのだ。重大なエラーや危険な操作を警告するのだ。/
		);
		expect(description).toBeInTheDocument();
	},
};

/**
 * タイトルなしのAlert
 */
export const WithoutTitle: Story = {
	name: "タイトルなし",
	args: {
		variant: "info",
	},
	render: (args) => (
		<MarkdownAlert {...args}>
			<Info />
			<MarkdownAlertDescription>
				<p>タイトルを省略したAlertなのだ。シンプルな情報表示に使えるのだ。</p>
			</MarkdownAlertDescription>
		</MarkdownAlert>
	),
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const description = canvas.getByText(
			/タイトルを省略したAlertなのだ。シンプルな情報表示に使えるのだ。/
		);
		expect(description).toBeInTheDocument();

		// タイトルが存在しないことを確認
		const titles = canvas.queryAllByRole("heading");
		expect(titles).toHaveLength(0);
	},
};

/**
 * アイコンなしのAlert
 */
export const WithoutIcon: Story = {
	name: "アイコンなし",
	args: {
		variant: "warning",
	},
	render: (args) => (
		<MarkdownAlert {...args}>
			<MarkdownAlertTitle>アイコンなしの警告</MarkdownAlertTitle>
			<MarkdownAlertDescription>
				<p>アイコンを省略したAlertなのだ。テキストのみで情報を伝えるのだ。</p>
			</MarkdownAlertDescription>
		</MarkdownAlert>
	),
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const title = canvas.getByText("アイコンなしの警告");
		expect(title).toBeInTheDocument();

		const description = canvas.getByText(
			/アイコンを省略したAlertなのだ。テキストのみで情報を伝えるのだ。/
		);
		expect(description).toBeInTheDocument();
	},
};

/**
 * 複数段落のコンテンツを含むAlert
 */
export const MultiParagraph: Story = {
	name: "複数段落のコンテンツ",
	args: {
		variant: "info",
	},
	render: (args) => (
		<MarkdownAlert {...args}>
			<Info />
			<MarkdownAlertTitle>詳細な情報</MarkdownAlertTitle>
			<MarkdownAlertDescription>
				<p>
					最初の段落なのだ。ここには基本的な情報を記載するのだ。複数の段落を使って詳細な説明ができるのだ。
				</p>
				<p>
					2つ目の段落なのだ。追加の詳細情報や補足説明を記載できるのだ。段落ごとに適切な間隔が設けられているのだ。
				</p>
				<p>3つ目の段落なのだ。必要に応じてさらに多くの情報を追加できるのだ。</p>
			</MarkdownAlertDescription>
		</MarkdownAlert>
	),
	play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const title = canvas.getByText("詳細な情報");
		expect(title).toBeInTheDocument();

		// 3つの段落が表示されていることを確認
		const paragraphs = canvas.getAllByText(/段落なのだ/);
		expect(paragraphs.length).toBeGreaterThanOrEqual(3);
	},
};

/**
 * すべてのvariantを一覧表示
 */
export const AllVariants: Story = {
	name: "すべてのvariantを表示",
	tags: ["code-only"],
	render: () => (
		<div className="space-y-4">
			<MarkdownAlert variant="default">
				<AlertCircle />
				<MarkdownAlertTitle>Note</MarkdownAlertTitle>
				<MarkdownAlertDescription>
					<p>デフォルトvariantのAlertなのだ</p>
				</MarkdownAlertDescription>
			</MarkdownAlert>

			<MarkdownAlert variant="info">
				<Info />
				<MarkdownAlertTitle>Info</MarkdownAlertTitle>
				<MarkdownAlertDescription>
					<p>infovariantのAlertなのだ</p>
				</MarkdownAlertDescription>
			</MarkdownAlert>

			<MarkdownAlert variant="success">
				<CheckCircle2 />
				<MarkdownAlertTitle>Success</MarkdownAlertTitle>
				<MarkdownAlertDescription>
					<p>successvariantのAlertなのだ</p>
				</MarkdownAlertDescription>
			</MarkdownAlert>

			<MarkdownAlert variant="warning">
				<AlertTriangle />
				<MarkdownAlertTitle>Warning</MarkdownAlertTitle>
				<MarkdownAlertDescription>
					<p>warningvariantのAlertなのだ</p>
				</MarkdownAlertDescription>
			</MarkdownAlert>

			<MarkdownAlert variant="destructive">
				<AlertOctagon />
				<MarkdownAlertTitle>Danger</MarkdownAlertTitle>
				<MarkdownAlertDescription>
					<p>destructivevariantのAlertなのだ</p>
				</MarkdownAlertDescription>
			</MarkdownAlert>
		</div>
	),
};

/**
 * 最小構成のAlert
 */
export const Minimal: Story = {
	name: "最小構成（アイコン・タイトルなし）",
	tags: ["code-only"],
	args: {
		variant: "default",
	},
	render: (args) => (
		<MarkdownAlert {...args}>
			<MarkdownAlertDescription>
				<p>最小構成のAlertなのだ。説明文のみで構成されているのだ。</p>
			</MarkdownAlertDescription>
		</MarkdownAlert>
	),
};
