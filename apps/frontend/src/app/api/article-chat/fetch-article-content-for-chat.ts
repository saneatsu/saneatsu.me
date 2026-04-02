import type { ArticleResponse, LanguageCode } from "@/shared/model";

/**
 * Service Bindingを取得する関数
 * Cloudflare Workers環境でのみ利用可能
 */
function getServiceBinding() {
	const cloudflareContext = (globalThis as Record<symbol, unknown>)[
		Symbol.for("__cloudflare-context__")
	] as { env?: { BACKEND_API?: { fetch: typeof fetch } } } | undefined;
	return cloudflareContext?.env?.BACKEND_API;
}

/**
 * AIチャット用に特定記事のMarkdownコンテンツを取得する
 *
 * @description
 * auth() を呼ばない軽量な取得関数。
 * Gemini Function Callingから呼ばれることを想定し、slugを指定して記事本文を取得する。
 *
 * @param slug - 記事のslug
 * @param language - 取得する記事の言語
 * @returns 記事のMarkdownコンテンツ（存在しない場合はnull）
 */
export async function fetchArticleContentForChat(
	slug: string,
	language: LanguageCode
): Promise<string | null> {
	const serviceBinding = getServiceBinding();

	let response: Response;

	if (serviceBinding) {
		const request = new Request(
			`https://backend/api/articles/${encodeURIComponent(slug)}?lang=${language}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
			}
		);
		response = await serviceBinding.fetch(request);
	} else {
		const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
		if (!apiBaseUrl) {
			throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
		}
		response = await fetch(
			`${apiBaseUrl}/api/articles/${encodeURIComponent(slug)}?lang=${language}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
			}
		);
	}

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		throw new Error(`Failed to fetch article content: ${response.status}`);
	}

	const data: ArticleResponse = await response.json();
	return data.data.content;
}
