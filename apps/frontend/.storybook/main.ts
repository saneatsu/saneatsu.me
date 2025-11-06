import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@storybook/addon-docs",
		"@storybook/addon-onboarding",
		"msw-storybook-addon",
	],
	framework: {
		name: "@storybook/nextjs",
		options: {},
	},
	staticDirs: ["../public"],
	env: (config) => ({
		...config,
		// Storybook環境用の環境変数をモック
		// これにより、@t3-oss/env-nextjsの環境変数検証が成功する
		NEXT_PUBLIC_API_URL:
			process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
		NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH:
			process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ||
			"mock-hash-for-storybook",
		NEXT_PUBLIC_MAPBOX_TOKEN:
			process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "mock-mapbox-token-for-storybook",
	}),
};
export default config;
