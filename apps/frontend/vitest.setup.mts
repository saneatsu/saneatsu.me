import "@testing-library/jest-dom";
import { vi } from "vitest";

// 環境変数の設定（テスト用）
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8888/api";
process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH = "test-account-hash";
process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "mock-mapbox-token-for-vitest";

// next-authのモック
vi.mock("next-auth", () => ({
	default: vi.fn(() => ({
		handlers: {
			GET: vi.fn(),
			POST: vi.fn(),
		},
		auth: vi.fn(),
		signIn: vi.fn(),
		signOut: vi.fn(),
	})),
}));

// next/serverのモック
vi.mock("next/server", () => ({
	NextRequest: vi.fn(),
	NextResponse: {
		json: vi.fn(),
		redirect: vi.fn(),
		next: vi.fn(),
	},
}));

// グローバルモック設定
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// IntersectionObserverのモック
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	disconnect: vi.fn(),
	unobserve: vi.fn(),
}));

// matchMediaのモック
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});
