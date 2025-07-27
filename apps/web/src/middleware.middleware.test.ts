import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { middleware } from "./middleware";
import {
	createMockNextRequest,
	expectRedirect,
	expectNext,
} from "./test-utils/middleware-test-utils";

// NextAuth.jsのgetTokenをモック
vi.mock("next-auth/jwt", () => ({
	getToken: vi.fn(),
}));

const { getToken } = await import("next-auth/jwt");
const mockGetToken = getToken as any;

describe("middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("認証チェック機能", () => {
		it("/adminパスへの認証済みアクセスは通常処理される", async () => {
			// 認証済みのトークンを返す
			mockGetToken.mockResolvedValue({ email: "test@example.com" });

			const request = createMockNextRequest("http://localhost:3333/admin");
			const response = await middleware(request);

			expectNext(response);
			expect(mockGetToken).toHaveBeenCalledWith({
				req: request,
				secret: "test-secret",
			});
		});

		it("/adminパスへの未認証アクセスはログインページへリダイレクトされる", async () => {
			// 未認証（null）を返す
			mockGetToken.mockResolvedValue(null);

			const request = createMockNextRequest("http://localhost:3333/admin");
			const response = await middleware(request);

			expectRedirect(response, "http://localhost:3333/login?callbackUrl=%2Fadmin");
		});

		it("/admin/articlesへの未認証アクセスもリダイレクトされる", async () => {
			mockGetToken.mockResolvedValue(null);

			const request = createMockNextRequest("http://localhost:3333/admin/articles");
			const response = await middleware(request);

			expectRedirect(response, "http://localhost:3333/login?callbackUrl=%2Fadmin%2Farticles");
		});

		it("認証チェック時にcallbackUrlが正しく設定される", async () => {
			mockGetToken.mockResolvedValue(null);

			const request = createMockNextRequest("http://localhost:3333/admin/tags?filter=tech");
			const response = await middleware(request);

			// callbackUrlにはパス名のみが含まれる（クエリパラメータは含まない）
			expectRedirect(response, "http://localhost:3333/login?callbackUrl=%2Fadmin%2Ftags");
		});
	});

	describe("言語検出・ルーティング機能", () => {
		it("URLにロケールなし、Accept-Language: jaの場合、/jaへリダイレクトされる", async () => {
			const request = createMockNextRequest("http://localhost:3333/articles", {
				headers: {
					"accept-language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
				},
			});
			const response = await middleware(request);

			expectRedirect(response, "http://localhost:3333/ja/articles");
		});

		it("URLにロケールなし、Accept-Language: enの場合、/enへリダイレクトされる", async () => {
			const request = createMockNextRequest("http://localhost:3333/articles", {
				headers: {
					"accept-language": "en-US,en;q=0.9,ja-JP;q=0.8,ja;q=0.7",
				},
			});
			const response = await middleware(request);

			expectRedirect(response, "http://localhost:3333/en/articles");
		});

		it("Accept-Languageヘッダーがない場合、デフォルトロケールへリダイレクトされる", async () => {
			const request = createMockNextRequest("http://localhost:3333/articles");
			const response = await middleware(request);

			// デフォルトロケールは "ja"
			expectRedirect(response, "http://localhost:3333/ja/articles");
		});

		it("複数言語の優先度（q値）が正しく処理される", async () => {
			const request = createMockNextRequest("http://localhost:3333/articles", {
				headers: {
					"accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ja-JP;q=0.6,ja;q=0.5",
				},
			});
			const response = await middleware(request);

			// frはサポートされていないので、次に優先度の高いenが選択される
			expectRedirect(response, "http://localhost:3333/en/articles");
		});

		it("サポートされていない言語の場合、デフォルトロケールへリダイレクトされる", async () => {
			const request = createMockNextRequest("http://localhost:3333/articles", {
				headers: {
					"accept-language": "de-DE,de;q=0.9,fr-FR;q=0.8",
				},
			});
			const response = await middleware(request);

			expectRedirect(response, "http://localhost:3333/ja/articles");
		});

		it("既にロケールが含まれている場合、リダイレクトされない", async () => {
			const request = createMockNextRequest("http://localhost:3333/ja/articles");
			const response = await middleware(request);

			expectNext(response);
		});

		it("ルートパスもロケールリダイレクトが適用される", async () => {
			const request = createMockNextRequest("http://localhost:3333/", {
				headers: {
					"accept-language": "en-US,en;q=0.9",
				},
			});
			const response = await middleware(request);

			expectRedirect(response, "http://localhost:3333/en/");
		});
	});

	describe("除外パスの処理", () => {
		it("/apiパスは処理をスキップする", async () => {
			const request = createMockNextRequest("http://localhost:3333/api/articles");
			const response = await middleware(request);

			expectNext(response);
			// getTokenが呼ばれないことを確認
			expect(mockGetToken).not.toHaveBeenCalled();
		});

		it("/loginパスは言語ルーティングをスキップする", async () => {
			const request = createMockNextRequest("http://localhost:3333/login", {
				headers: {
					"accept-language": "ja-JP,ja;q=0.9",
				},
			});
			const response = await middleware(request);

			// リダイレクトされない
			expectNext(response);
		});

		it("/admin/loginのような複合パスも正しく処理される", async () => {
			// 認証済みの場合
			mockGetToken.mockResolvedValue({ email: "test@example.com" });

			const request = createMockNextRequest("http://localhost:3333/admin/login");
			const response = await middleware(request);

			// /adminで始まるので認証チェックが行われる
			expect(mockGetToken).toHaveBeenCalled();
			expectNext(response);
		});
	});

	describe("ヘルパー関数のテスト", () => {
		it("複雑なAccept-Languageヘッダーが正しく解析される", async () => {
			const request = createMockNextRequest("http://localhost:3333/", {
				headers: {
					"accept-language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6,zh;q=0.5",
				},
			});
			const response = await middleware(request);

			// 最も優先度の高いjaが選択される
			expectRedirect(response, "http://localhost:3333/ja/");
		});

		it("言語コードのみ（国コードなし）でも正しく処理される", async () => {
			const request = createMockNextRequest("http://localhost:3333/", {
				headers: {
					"accept-language": "en,ja;q=0.8",
				},
			});
			const response = await middleware(request);

			expectRedirect(response, "http://localhost:3333/en/");
		});

		it("q値が明示的に指定されていない場合、1.0として扱われる", async () => {
			const request = createMockNextRequest("http://localhost:3333/", {
				headers: {
					"accept-language": "ja;q=0.8,en",
				},
			});
			const response = await middleware(request);

			// enのq値は暗黙的に1.0なので、enが選択される
			expectRedirect(response, "http://localhost:3333/en/");
		});
	});
});