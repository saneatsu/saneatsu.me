import type { Meta, StoryObj } from "@storybook/nextjs";

import { TweetEmbed } from "./tweet-embed";

const meta: Meta<typeof TweetEmbed> = {
	component: TweetEmbed,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 基本的なTweet表示
 *
 * @description
 * Twitter創業者Jack Dorseyの最初のツイート（2006年3月21日）
 */
export const BasicTweet: Story = {
	name: "基本的なTweet表示",
	tags: ["code-only"],
	args: {
		id: "20",
	},
};

/**
 * 画像付きTweet
 *
 * @description
 * 画像を含むツイートの表示例
 */
export const TweetWithImage: Story = {
	name: "画像付きTweet",
	tags: ["code-only"],
	args: {
		id: "1349129669258448897",
	},
};

/**
 * 動画付きTweet
 *
 * @description
 * 動画を含むツイートの表示例
 */
export const TweetWithVideo: Story = {
	name: "動画付きTweet",
	tags: ["code-only"],
	args: {
		id: "1577018510331535360",
	},
};

/**
 * 長文Tweet
 *
 * @description
 * 長いテキストを含むツイートの表示例
 */
export const LongTweet: Story = {
	name: "長文Tweet",
	tags: ["code-only"],
	args: {
		id: "1354143047526977537",
	},
};

/**
 * リプライTweet
 *
 * @description
 * リプライのツイートの表示例
 * スレッドの一部として表示される
 */
export const ReplyTweet: Story = {
	name: "リプライTweet",
	tags: ["code-only"],
	args: {
		id: "1683899535324991488",
	},
};

/**
 * カスタムクラス名を適用
 *
 * @description
 * カスタムクラス名を適用した表示例
 */
export const WithCustomClassName: Story = {
	name: "カスタムクラス名適用",
	tags: ["code-only"],
	args: {
		id: "20",
		className: "border-2 border-primary rounded-lg p-4",
	},
};

/**
 * 複数のTweetを並べて表示
 *
 * @description
 * 複数のツイートを並べて表示する例
 */
export const MultipleTweets: Story = {
	name: "複数のTweet表示",
	tags: ["code-only"],
	render: () => {
		return (
			<div className="space-y-8">
				<div>
					<h3 className="text-lg font-semibold mb-4">
						Jack Dorseyの最初のツイート
					</h3>
					<TweetEmbed id="20" />
				</div>
				<div>
					<h3 className="text-lg font-semibold mb-4">画像付きツイート</h3>
					<TweetEmbed id="1349129669258448897" />
				</div>
			</div>
		);
	},
};

/**
 * ダークテーマでの表示
 *
 * @description
 * ダークテーマでのツイート表示例
 * Storybookのテーマ切り替えで確認してください
 */
export const DarkTheme: Story = {
	name: "ダークテーマ表示",
	tags: ["code-only"],
	args: {
		id: "20",
	},
	parameters: {
		backgrounds: {
			default: "dark",
		},
	},
};

/**
 * モバイル表示
 *
 * @description
 * モバイルデバイスでのツイート表示例
 */
export const MobileView: Story = {
	name: "モバイル表示",
	tags: ["code-only"],
	args: {
		id: "20",
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

/**
 * タブレット表示
 *
 * @description
 * タブレットデバイスでのツイート表示例
 */
export const TabletView: Story = {
	name: "タブレット表示",
	tags: ["code-only"],
	args: {
		id: "20",
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};
