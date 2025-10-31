import type { Meta, StoryObj } from "@storybook/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fn } from "storybook/test";

import { ArticleThumbnailUploader } from "./article-thumbnail-uploader";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

const meta: Meta<typeof ArticleThumbnailUploader> = {
	component: ArticleThumbnailUploader,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
	decorators: [
		(Story) => (
			<QueryClientProvider client={queryClient}>
				<div className="p-4 max-w-2xl">
					<Story />
				</div>
			</QueryClientProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * サムネイルなし状態
 */
export const NoThumbnail: Story = {
	name: "サムネイルなし状態",
	tags: ["code-only"],
	args: {
		articleId: 1,
		thumbnailUrl: null,
		onUploadSuccess: fn(),
		onDeleteSuccess: fn(),
		onError: fn(),
	},
};

/**
 * サムネイルあり状態
 */
export const WithThumbnail: Story = {
	name: "サムネイルあり状態",
	tags: ["code-only"],
	args: {
		articleId: 1,
		thumbnailUrl: "https://imagedelivery.net/test-hash/test-image-id/medium",
		onUploadSuccess: fn(),
		onDeleteSuccess: fn(),
		onError: fn(),
	},
};

/**
 * 無効状態（articleIdなし）
 */
export const DisabledState: Story = {
	name: "無効状態（articleIdなし）",
	tags: ["code-only"],
	args: {
		articleId: undefined,
		thumbnailUrl: null,
		disabled: true,
		onUploadSuccess: fn(),
		onDeleteSuccess: fn(),
		onError: fn(),
	},
};

/**
 * アップロード中状態
 */
export const Uploading: Story = {
	name: "アップロード中状態",
	tags: ["code-only"],
	args: {
		articleId: 1,
		thumbnailUrl: null,
		onUploadSuccess: fn(),
		onDeleteSuccess: fn(),
		onError: fn(),
	},
};

/**
 * 削除中状態
 */
export const Deleting: Story = {
	name: "削除中状態",
	tags: ["code-only"],
	args: {
		articleId: 1,
		thumbnailUrl: "https://imagedelivery.net/test-hash/test-image-id/medium",
		onUploadSuccess: fn(),
		onDeleteSuccess: fn(),
		onError: fn(),
	},
};
