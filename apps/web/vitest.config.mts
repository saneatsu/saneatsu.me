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
		// react-tweetのCSS modulesをVitestが正しく処理できるようにinlineにする
		// これにより "Unknown file extension .css" エラーを回避できる
		deps: {
			inline: ["react-tweet"],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@uiw/react-md-editor/markdown-editor.css": path.resolve(
				__dirname,
				"./vitest-mocks/empty.css"
			),
			"@uiw/react-markdown-preview/markdown.css": path.resolve(
				__dirname,
				"./vitest-mocks/empty.css"
			),
		},
	},
});
