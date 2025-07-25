import "@testing-library/jest-dom";

/**
 * Vitestグローバルセットアップファイル
 * 全プロジェクト共通のテスト設定
 */

import { vi } from "vitest";

// next-intlのモック設定
vi.mock("next-intl", () => ({
	useTranslations: vi.fn(() => (key: string) => key),
	useLocale: vi.fn(() => "ja"),
}));

// Next.jsの useRouter をモック
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	})),
	usePathname: vi.fn(() => "/"),
	useSearchParams: vi.fn(() => new URLSearchParams()),
	notFound: vi.fn(),
}));

// グローバルテストユーティリティ
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// window.matchMedia のモック
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
