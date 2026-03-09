import type { Env } from "@/env";

/**
 * テスト用の共通モック環境変数
 *
 * Env型を満たす完全な定数で、各テストファイルで個別に定義する必要をなくす。
 * GEMINI_API_KEYはZodバリデーション（"AI"で始まる30文字以上）に準拠している。
 */
export const mockEnv: Env = {
	NODE_ENV: "development",
	TURSO_DATABASE_URL: "test-db-url",
	TURSO_AUTH_TOKEN: "test-auth-token",
	CLOUDFLARE_ACCOUNT_ID: "test-account-id",
	CLOUDFLARE_API_TOKEN: "test-token",
	CLOUDFLARE_ACCOUNT_HASH: "test-hash",
	GEMINI_API_KEY: "AItest-gemini-api-key-for-testing-purposes-only",
	MAPBOX_ACCESS_TOKEN: "test-mapbox-token",
	GOOGLE_FORM_URL:
		"https://docs.google.com/forms/d/e/test-form-id/formResponse",
};
