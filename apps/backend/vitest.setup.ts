import { config } from "dotenv";
import { vi } from "vitest";

// テスト用の環境変数を読み込む
config({ path: ".env" });

// テスト用の環境変数を設定（存在しない場合のデフォルト値）
if (!process.env.TURSO_DATABASE_URL) {
	process.env.TURSO_DATABASE_URL = "file:./test.db";
}
if (!process.env.TURSO_AUTH_TOKEN) {
	process.env.TURSO_AUTH_TOKEN = "test-token";
}

// NODE_ENVをtestに設定
// @ts-expect-error NODE_ENVは読み取り専用プロパティだが、テスト環境では設定が必要
process.env.NODE_ENV = "test";

// ----------------------------------------------
// すべてのテストで共通のモックを設定
// ----------------------------------------------

// Drizzle DBクライアントのモック
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
	tags: {},
	tagTranslations: {},
}));
