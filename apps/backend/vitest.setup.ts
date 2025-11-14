import { vi } from "vitest";

// テスト用の環境変数を設定（存在しない場合のデフォルト値）
const defaultTestEnv: Record<string, string> = {
	NODE_ENV: "test",
	TURSO_DATABASE_URL: "file:./test.db",
	TURSO_AUTH_TOKEN: "test-token",
	CLOUDFLARE_ACCOUNT_ID: "test-account-id",
	CLOUDFLARE_ACCOUNT_HASH: "test-account-hash",
	CLOUDFLARE_API_TOKEN: "test-api-token",
	GEMINI_API_KEY: "AI_TEST_GEMINI_API_KEY_FOR_BACKEND_SUITE_123",
	MAPBOX_ACCESS_TOKEN: "test-mapbox-token",
	CORS_ORIGIN: "http://localhost:3333",
};

for (const [key, value] of Object.entries(defaultTestEnv)) {
	if (!process.env[key]) {
		process.env[key] = value;
	}
}

// ----------------------------------------------
// すべてのテストで共通のモックを設定
// ----------------------------------------------

// Drizzle DBクライアントのモック
// setupDbMocks()で個別にカスタムできるよう基本的なモック設定
vi.mock("@saneatsu/db", () => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		$count: vi.fn(),
	},
	articles: {},
	articleTranslations: {},
}));
