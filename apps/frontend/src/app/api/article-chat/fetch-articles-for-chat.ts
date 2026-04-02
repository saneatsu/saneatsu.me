import type { ArticlesResponse, LanguageCode } from "@/shared/model";

/** チャット用に必要な最小限の記事情報 */
export interface ArticleSummary {
	slug: string;
	title: string;
}

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
 * AIチャット用に全公開記事のタイトル・slug一覧を取得する
 *
 * @description
 * auth() を呼ばない軽量な取得関数。
 * Service Binding（本番）またはHTTP（開発）でバックエンドAPIから公開記事一覧を取得し、
 * タイトルとslugだけを返す。
 *
 * @param language - 取得する記事の言語
 * @returns タイトルとslugの配列
 */
export async function fetchArticlesForChat(
	language: LanguageCode
): Promise<ArticleSummary[]> {
	const params = new URLSearchParams({
		status: "published",
		language,
		limit: "200",
	});

	const serviceBinding = getServiceBinding();

	let response: Response;

	if (serviceBinding) {
		const request = new Request(
			`https://backend/api/articles?${params.toString()}`,
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
		response = await fetch(`${apiBaseUrl}/api/articles?${params.toString()}`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});
	}

	if (!response.ok) {
		throw new Error(`Failed to fetch articles: ${response.status}`);
	}

	const data: ArticlesResponse = await response.json();
	return data.data.map(({ slug, title }) => ({ slug, title }));
}
