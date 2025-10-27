import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			// CSSモジュールをidentity-obj-proxyでモック
			"\\.(css|less|scss|sass)$": "identity-obj-proxy",
		},
	},
	test: {
		globals: true,
		// Reactコンポーネントテスト用にjsdom環境を使用
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		exclude: [
			"node_modules",
			"dist",
			".next",
			"build",
			".turbo",
			".vercel",
			"**/e2e/**",
		],
		coverage: {
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"dist/",
				".next/",
				"build/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/*.spec.*",
				"**/*.test.*",
			],
		},
	},
});
