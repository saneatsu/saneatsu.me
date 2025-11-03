import { NextRequest, type NextResponse } from "next/server";
import { expect, vi } from "vitest";

/**
 * NextRequestのモックを作成する
 *
 * @param url - リクエストURL
 * @param options - 追加オプション
 * @returns モックされたNextRequest
 */
export function createMockNextRequest(
	url: string,
	options?: {
		headers?: Record<string, string>;
		method?: string;
		cookies?: Record<string, string>;
	}
): NextRequest {
	const headers = new Headers(options?.headers);

	// cookiesの処理
	if (options?.cookies) {
		const cookieString = Object.entries(options.cookies)
			.map(([key, value]) => `${key}=${value}`)
			.join("; ");
		headers.set("cookie", cookieString);
	}

	const request = new NextRequest(url, {
		method: options?.method || "GET",
		headers,
	});

	return request;
}

/**
 * NextAuth.jsのgetTokenモックを作成する
 *
 * @param token - 返すトークンオブジェクト（nullで未認証）
 * @returns モック関数
 */
export function createGetTokenMock(token: unknown) {
	return vi.fn().mockResolvedValue(token);
}

/**
 * NextResponseのredirect呼び出しを検証する
 *
 * @param response - NextResponse
 * @param expectedUrl - 期待されるリダイレクトURL
 */
export function expectRedirect(response: NextResponse, expectedUrl: string) {
	expect(response.status).toBe(307); // NextResponse.redirectはデフォルトで307
	const location = response.headers.get("location");
	expect(location).toBe(expectedUrl);
}

/**
 * NextResponseのnext呼び出しを検証する
 *
 * @param response - NextResponse
 */
export function expectNext(response: NextResponse) {
	// NextResponse.next()は特定のヘッダーを持たない
	expect(response.status).toBe(200);
	expect(response.headers.get("location")).toBeNull();
}
