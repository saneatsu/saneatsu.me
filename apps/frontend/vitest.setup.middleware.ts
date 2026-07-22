import { vi } from "vitest";

// グローバルな環境変数のモック
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";

// /loginのBasic認証で参照される資格情報。
// 未設定だとmiddlewareがEdge Runtime向けの`self`フォールバックまで
// 評価してしまい、node環境では`self is not defined`で落ちるため明示的に設定する。
process.env.BASIC_AUTH_USER = "admin";
process.env.BASIC_AUTH_PASSWORD = "password";

// console.logのモック（テスト出力をクリーンに保つ）
global.console = {
	...console,
	log: vi.fn(),
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
};
