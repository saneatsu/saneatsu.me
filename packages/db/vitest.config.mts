import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		// Node.js環境を使用（データベーステスト用）
		environment: "node",
		// setupFilesを無効化（ルート設定を上書き）
		setupFiles: [],
		include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
		exclude: [
			"node_modules",
			"dist",
			"build",
			".turbo",
			"sqld-test2",
		],
		coverage: {
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"dist/",
				"build/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/*.spec.*",
				"**/*.test.*",
				"drizzle/",
				"sqld-test2/",
			],
		},
	},
});
