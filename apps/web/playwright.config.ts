import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright設定ファイル
 *
 * @description
 * E2Eテストの実行設定を定義する。
 * ローカル開発サーバーを使用してテストを実行する。
 */
export default defineConfig({
	// テストディレクトリ
	testDir: "./e2e",

	// 各テストのタイムアウト（30秒）
	timeout: 30000,

	// 並列実行を無効化（データベースの競合を避けるため）
	fullyParallel: false,

	// 失敗時の動作
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,

	// レポーター設定
	reporter: [
		["html"],
		["list"]
	],

	// グローバル設定
	use: {
		// ベースURL
		baseURL: "http://localhost:3333",

		// スクリーンショットの設定
		screenshot: "only-on-failure",

		// ビデオ録画の設定
		video: "retain-on-failure",

		// トレースの設定
		trace: "on-first-retry",
	},

	// プロジェクト設定（ブラウザ別）
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
	],

	// ローカル開発サーバーの起動設定
	// 既存のサーバーを使用する場合はコメントアウト
	/*
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3333",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000, // 2分
	},
	*/
});