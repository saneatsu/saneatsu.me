import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * ミドルウェア専用のVitest設定。
 *
 * メインのvitest.config.mtsとは意図的に分離している。理由は以下の2点で、
 * どちらも「両立できないグローバル設定」を要求するため同居できない。
 *
 * 1. 実行環境の違い
 *    メインはReactコンポーネント向けにjsdom環境。ミドルウェアはサーバー/Edgeで
 *    動くコードなのでnode環境が必要。
 * 2. next/serverのモックの有無
 *    メインのsetup(vitest.setup.mts)はnext/serverをグローバルにモックしており、
 *    NextResponse.redirect/nextが空関数(undefinedを返す)になる。一方この
 *    ミドルウェアテストは本物のNextResponse(status・locationヘッダー)を検証する
 *    ため、モックされていないnext/serverが必要。
 *
 * そのためメイン設定では`*.middleware.test.*`を除外し、こちらは
 * `pnpm test:middleware`として実行する(CIでも個別ステップで実行する)。
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		environment: "node",
		setupFiles: ["./vitest.setup.middleware.ts"],
		globals: true,
		include: ["**/*.middleware.test.{js,ts,mjs,mts}"],
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
