/// <reference types="vitest" />
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	// Reactプラグインを一時的に削除（ES Module互換性の問題を回避）
	esbuild: {
		jsx: "automatic",
		jsxInject: `import React from 'react'`,
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest.setup.mts"],
		globals: true,
		include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		exclude: [
			"node_modules/**",
			"dist/**",
			"build/**",
			"**/*.stories.{js,jsx,ts,tsx}",
			"**/*.middleware.test.{js,ts,mjs,mts}",
			"**/*.bak/**",
		],
		css: true,
		coverage: {
			reporter: ["text", "json-summary", "json", "html"],
			reportsDirectory: "./coverage",
		},
		server: {
			deps: {
				// next-intl v4 は next/navigation を直接 import するため、Vite 経由で解決させる
				inline: ["next-intl"],
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			// VitestはNext.js独自の拡張子省略解決を知らないため .js 付きで解決させる
			"next/navigation": path.resolve(
				__dirname,
				"./node_modules/next/navigation.js"
			),
		},
	},
});
