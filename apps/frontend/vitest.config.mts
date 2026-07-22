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
			// ミドルウェアテストは別設定(vitest.config.middleware.mts)で実行するため除外する。
			// 理由: このメイン設定はjsdom環境で、setup(vitest.setup.mts)がnext/serverを
			// グローバルにモックしている。一方ミドルウェアテストはnode環境かつ本物の
			// NextResponse(status/locationヘッダー)の検証が必要で、両者は両立しない
			// グローバル設定を要求するため分離している。CIでは`pnpm test:middleware`で個別実行する。
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
				inline: ["next-intl"],
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"next/navigation": path.resolve(
				__dirname,
				"./node_modules/next/navigation.js"
			),
		},
	},
});
