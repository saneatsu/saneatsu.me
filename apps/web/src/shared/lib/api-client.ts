import type { AppType } from "@saneatsu/backend";
import { hc } from "hono/client";
import type {
	ArticleCreateRequest,
	ArticleCreateResponse,
	ArticleDetailQuery,
	ArticleResponse,
	ArticlesQuery,
	ArticlesResponse,
	SlugCheckQuery,
	SlugCheckResponse,
} from "../types/article";
import type { ApiError } from "../types/common";
import type { TagsQuery, TagsResponse } from "../types/tag";

/**
 * APIのベースURL
 * 開発環境では相対パスを使用
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Hono Clientの初期化
 * バックエンドAPIの型情報を使用して型安全なクライアントを作成
 */
const client = hc<AppType>(API_BASE_URL) as any;

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
 * APIレスポンスのエラーハンドリング
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
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
}

/**
 * 記事一覧を取得
 */
export async function fetchArticles(
	query: ArticlesQuery = {}
): Promise<ArticlesResponse> {
	const response = await client.api.articles.$get({
		query: {
			page: query.page,
			limit: query.limit,
			language: query.lang as "ja" | "en" | undefined,
			status: query.status as "published" | "draft" | "archived" | undefined,
			search: query.search,
			sortBy: query.sortBy as
				| "createdAt"
				| "updatedAt"
				| "publishedAt"
				| "title"
				| "viewCount"
				| undefined,
			sortOrder: query.sortOrder as "asc" | "desc" | undefined,
		},
	});

	return handleApiResponse<ArticlesResponse>(response);
}

/**
 * 記事詳細を取得
 */
export async function fetchArticle(
	slug: string,
	query: ArticleDetailQuery = {}
): Promise<ArticleResponse> {
	const response = await client.api.articles[":slug"].$get({
		param: { slug },
		query: {
			lang: query.lang as "ja" | "en" | undefined,
		},
	});

	return handleApiResponse<ArticleResponse>(response);
}

/**
 * 管理用：全記事を取得（ステータス問わず）
 * 注意：この関数は管理画面専用です。実際の実装では認証が必要です。
 * sortBy と sortOrder パラメータを追加
 */
export async function fetchAllArticles(
	query: ArticlesQuery & {
		status?: string;
		search?: string;
		sortBy?: string;
		sortOrder?: string;
	} = {}
): Promise<ArticlesResponse> {
	const response = await client.api.articles.$get({
		query: {
			page: query.page,
			limit: query.limit,
			language: query.lang as "ja" | "en" | undefined,
			status: query.status as "published" | "draft" | "archived" | undefined,
			search: query.search,
			sortBy: query.sortBy as
				| "createdAt"
				| "updatedAt"
				| "publishedAt"
				| "title"
				| "viewCount"
				| undefined,
			sortOrder: query.sortOrder as "asc" | "desc" | undefined,
		},
	});

	return handleApiResponse<ArticlesResponse>(response);
}

/**
 * 記事のステータスを更新
 * 注意：この関数は管理画面専用です。実際の実装では認証が必要です。
 * 現在は未実装のため、仮実装として残す
 */
export async function updateArticleStatus(
	id: number,
	status: string
): Promise<{ success: boolean }> {
	// TODO: バックエンドにPATCH /admin/articles/:id/status エンドポイントを実装後にHono Client版に書き換え
	throw new Error("Not implemented yet");
}

/**
 * 記事を削除
 * 注意：この関数は管理画面専用です。実際の実装では認証が必要です。
 * 現在は未実装のため、仮実装として残す
 */
export async function deleteArticle(id: number): Promise<{ success: boolean }> {
	// TODO: バックエンドにDELETE /admin/articles/:id エンドポイントを実装後にHono Client版に書き換え
	throw new Error("Not implemented yet");
}

/**
 * スラッグの重複をチェック
 * 注意：この関数は管理画面専用です。実際の実装では認証が必要です。
 */
export async function checkSlugAvailability(
	query: SlugCheckQuery
): Promise<SlugCheckResponse> {
	const response = await client.api.articles["check-slug"].$get({
		query: {
			slug: query.slug,
		},
	});

	return handleApiResponse<SlugCheckResponse>(response);
}

/**
 * 記事を作成
 * 注意：この関数は管理画面専用です。実際の実装では認証が必要です。
 */
export async function createArticle(
	data: ArticleCreateRequest
): Promise<ArticleCreateResponse> {
	const response = await client.api.articles.$post({
		json: {
			title: data.title,
			slug: data.slug,
			content: data.content,
			status: data.status as "draft" | "published",
			publishedAt: data.publishedAt,
			tagIds: data.tagIds,
		},
	});

	return handleApiResponse<ArticleCreateResponse>(response);
}

/**
 * タグ一覧を取得
 */
export async function fetchTags(query: TagsQuery = {}): Promise<TagsResponse> {
	const response = await client.api.tags.$get({
		query: {
			lang: (query.lang || "ja") as "ja" | "en",
		},
	});

	return handleApiResponse<TagsResponse>(response);
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
