import type {
	ApiError,
	ArticleCreateRequest,
	ArticleCreateResponse,
	ArticleDetailQuery,
	ArticleResponse,
	ArticlesQuery,
	ArticlesResponse,
	SlugCheckQuery,
	SlugCheckResponse,
} from "../types/article";
import type { TagsQuery, TagsResponse } from "../types/tag";

/**
 * APIのベースURL
 * 開発環境では相対パスを使用
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

/**
 * APIクライアントのエラークラス
 */
export class ApiClientError extends Error {
	constructor(
		message: string,
		public status: number,
		public code?: string
	) {
		super(message);
		this.name = "ApiClientError";
	}
}

/**
 * クエリパラメータをURLSearchParamsに変換
 */
function buildQueryParams(params: Record<string, string | undefined>): string {
	const searchParams = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined) {
			searchParams.append(key, value);
		}
	});

	const queryString = searchParams.toString();
	return queryString ? `?${queryString}` : "";
}

/**
 * APIリクエストを実行する汎用関数
 */
async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${API_BASE_URL}${endpoint}`;

	try {
		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			...options,
		});

		const data = await response.json();

		if (!response.ok) {
			const error = data as ApiError;
			throw new ApiClientError(
				error.error.message || "API request failed",
				response.status,
				error.error.code
			);
		}

		return data;
	} catch (error) {
		if (error instanceof ApiClientError) {
			throw error;
		}

		// ネットワークエラーなどの場合
		throw new ApiClientError(
			error instanceof Error ? error.message : "Unknown error occurred",
			0
		);
	}
}

/**
 * 記事一覧を取得
 */
export async function fetchArticles(
	query: ArticlesQuery = {}
): Promise<ArticlesResponse> {
	const queryString = buildQueryParams({
		page: query.page,
		limit: query.limit,
		lang: query.lang,
	});

	return apiRequest<ArticlesResponse>(`/articles${queryString}`);
}

/**
 * 記事詳細を取得
 */
export async function fetchArticle(
	slug: string,
	query: ArticleDetailQuery = {}
): Promise<ArticleResponse> {
	const queryString = buildQueryParams({
		lang: query.lang,
	});

	return apiRequest<ArticleResponse>(`/articles/${slug}${queryString}`);
}

/**
 * 管理用：全記事を取得（ステータス問わず）
 * 注意：この関数は管理画面専用です。実際の実装では認証が必要です。
 * 一時的に既存の /api/articles エンドポイントを使用
 */
export async function fetchAllArticles(
	query: ArticlesQuery & { status?: string; search?: string } = {}
): Promise<ArticlesResponse> {
	const queryString = buildQueryParams({
		page: query.page,
		limit: query.limit,
		lang: query.lang,
		status: query.status,
		search: query.search,
	});

	// 一時的に既存のAPIエンドポイントを使用
	// 将来的には /admin/articles エンドポイントを実装予定
	return apiRequest<ArticlesResponse>(`/articles${queryString}`);
}

/**
 * 記事のステータスを更新
 * 注意：この関数は管理画面専用です。実際の実装では認証が必要です。
 */
export async function updateArticleStatus(
	id: number,
	status: string
): Promise<{ success: boolean }> {
	return apiRequest<{ success: boolean }>(`/admin/articles/${id}/status`, {
		method: "PATCH",
		body: JSON.stringify({ status }),
	});
}

/**
 * 記事を削除
 * 注意：この関数は管理画面専用です。実際の実装では認証が必要です。
 */
export async function deleteArticle(id: number): Promise<{ success: boolean }> {
	return apiRequest<{ success: boolean }>(`/admin/articles/${id}`, {
		method: "DELETE",
	});
}

/**
 * スラッグの重複をチェック
 * 注意：この関数は管理画面専用です。実際の実装では認証が必要です。
 */
export async function checkSlugAvailability(
	query: SlugCheckQuery
): Promise<SlugCheckResponse> {
	const queryString = buildQueryParams({
		slug: query.slug,
	});

	return apiRequest<SlugCheckResponse>(`/articles/check-slug${queryString}`);
}

/**
 * 記事を作成
 * 注意：この関数は管理画面専用です。実際の実装では認証が必要です。
 */
export async function createArticle(
	data: ArticleCreateRequest
): Promise<ArticleCreateResponse> {
	return apiRequest<ArticleCreateResponse>("/articles", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

/**
 * タグ一覧を取得
 */
export async function fetchTags(query: TagsQuery = {}): Promise<TagsResponse> {
	const queryString = buildQueryParams({
		lang: query.lang || "ja",
	});

	return apiRequest<TagsResponse>(`/tags${queryString}`);
}

/**
 * APIエラーがApiClientErrorかどうかを判定
 */
export function isApiClientError(error: unknown): error is ApiClientError {
	return error instanceof ApiClientError;
}

/**
 * エラーメッセージを取得
 */
export function getErrorMessage(error: unknown): string {
	if (isApiClientError(error)) {
		return error.message;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "不明なエラーが発生しました";
}
