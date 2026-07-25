import type { AppType } from "@saneatsu/backend";
import { hc } from "hono/client";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
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
} from "@/shared/model";

/**
 * Service Bindingを取得する関数
 * Cloudflare Workers環境でのみ利用可能
 */
function getServiceBinding() {
	// OpenNext Cloudflareの環境変数アクセス方法
	const cloudflareContext = (globalThis as any)[
		Symbol.for("__cloudflare-context__")
	];
	return cloudflareContext?.env?.BACKEND_API;
}

/**
 * APIのベースURL
 * 環境変数から取得（必須）
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
	throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
}

/**
 * Hono Clientの初期化
 * バックエンドAPIの型情報を使用して型安全なクライアントを作成
 */
const client = hc<AppType>(API_BASE_URL);

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
 * ApiErrorの型ガード関数
 */
function isApiError(data: unknown): data is ApiError {
	return (
		typeof data === "object" &&
		data !== null &&
		"error" in data &&
		typeof data.error === "object" &&
		data.error !== null &&
		"message" in data.error &&
		"code" in data.error
	);
}

/**
 * APIレスポンスのエラーハンドリング
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
	const data = await response.json();

	if (!response.ok) {
		if (isApiError(data)) {
			throw new ApiClientError(
				data.error.message || "API request failed",
				response.status,
				data.error.code
			);
		}
		// エラーの形式が不明な場合のフォールバック
		throw new ApiClientError("API request failed", response.status);
	}

	return data;
}

/**
 * 記事一覧を取得
 */
export async function fetchArticles(
	query: ArticlesQuery = {}
): Promise<ArticlesResponse> {
	// Service Bindingが利用可能かチェック
	const serviceBinding = getServiceBinding();

	// Service Bindingが利用可能な場合は使用
	if (serviceBinding) {
		// クエリパラメータを構築
		const params = new URLSearchParams();
		if (query.page) params.set("page", query.page);
		if (query.limit) params.set("limit", query.limit);
		if (query.lang) params.set("language", query.lang);
		if (query.status) params.set("status", query.status);
		if (query.search) params.set("search", query.search);
		if (query.sortBy) params.set("sortBy", query.sortBy);
		if (query.sortOrder) params.set("sortOrder", query.sortOrder);

		// Service Bindingを使用したリクエスト
		const url = `https://backend/api/articles?${params.toString()}`;

		const request = new Request(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		try {
			const response = await serviceBinding.fetch(request);
			return handleApiResponse<ArticlesResponse>(response);
		} catch (error) {
			console.error("Service Binding Error:", error);
			throw error;
		}
	}

	// Service Bindingが利用できない場合は通常のHTTP経由
	const response = await client.api.articles.$get({
		query: {
			page: query.page,
			limit: query.limit,
			language: query.lang as "ja" | "en" | "es" | undefined,
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
 *
 * @description
 * Server Componentから呼ばれるため、NextAuthのauth()でセッション情報を取得し、
 * ログイン中のユーザーの場合は`X-User-Email`ヘッダーを送信する。
 * これにより、バックエンドでログイン中のユーザーを識別し、閲覧数カウントから除外できる。
 */
export async function fetchArticle(
	slug: string,
	query: ArticleDetailQuery = {}
): Promise<ArticleResponse> {
	// NextAuthのセッション情報を取得（Server Component用）
	// Cloudflare Workers環境でエラーが発生する可能性があるため、try-catchで囲む
	let session = null;
	try {
		session = await auth();
	} catch (error) {
		console.warn("⚠️ Failed to get session, continuing without it:", error);
	}

	// Service Bindingが利用可能かチェック
	const serviceBinding = getServiceBinding();

	// Service Bindingが利用可能な場合は使用
	if (serviceBinding) {
		// Service Bindingを使用したリクエスト
		const url = `https://backend/api/articles/${slug}?lang=${query.lang || "ja"}`;

		const bindingHeaders: Record<string, string> = {
			"Content-Type": "application/json",
		};

		// ログイン中のユーザーの場合、X-User-Emailヘッダーを追加
		const email = session?.user?.email;
		if (typeof email === "string") {
			bindingHeaders["X-User-Email"] = email;
		}

		const request = new Request(url, {
			method: "GET",
			headers: bindingHeaders,
		});

		try {
			const response = await serviceBinding.fetch(request);
			return handleApiResponse<ArticleResponse>(response);
		} catch (error) {
			console.error("Service Binding Error:", error);
			throw error;
		}
	}

	// Service Bindingが利用できない場合は通常のHTTP経由
	const fullUrl = `${API_BASE_URL}/api/articles/${slug}?lang=${query.lang || "ja"}`;

	// Hono Clientの$getに直接headersを渡せないため、fetchを使用
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	// ログイン中のユーザーの場合、X-User-Emailヘッダーを追加
	const email = session?.user?.email;
	if (typeof email === "string") {
		headers["X-User-Email"] = email;
	}

	const response = await fetch(fullUrl, {
		method: "GET",
		headers,
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
			language: query.lang as "ja" | "en" | "es" | undefined,
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
	_id: number,
	_status: string
): Promise<{ success: boolean }> {
	// TODO: バックエンドにPATCH /admin/articles/:id/status エンドポイントを実装後にHono Client版に書き換え
	throw new Error("Not implemented yet");
}

/**
 * 記事を削除
 * 注意：この関数は管理画面専用です。実際の実装では認証が必要です。
 * 現在は未実装のため、仮実装として残す
 */
export async function deleteArticle(
	_id: number
): Promise<{ success: boolean }> {
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
		},
	});

	return handleApiResponse<ArticleCreateResponse>(response);
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

/**
 * ユーザー情報を作成または更新
 *
 * @param profile - Googleプロフィール情報
 * @returns 作成または更新されたユーザー情報
 */
export async function upsertUser(profile: {
	email: string;
	name: string;
	picture?: string;
	sub: string;
}) {
	try {
		// Service Bindingが利用可能かチェック
		const serviceBinding = getServiceBinding();

		if (serviceBinding) {
			console.log("🔍 Using Service Binding for upsertUser API");

			// Service Bindingを使用したリクエスト
			const request = new Request("https://backend/api/auth/user", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(profile),
			});

			const response = await serviceBinding.fetch(request);

			if (!response.ok) {
				const error = await response.json();
				throw new ApiClientError(
					error.error?.message || "Failed to upsert user",
					response.status,
					error.error?.code
				);
			}

			return await response.json();
		}

		// Service Bindingが利用できない場合は通常のfetch
		console.log("🔍 Calling upsertUser API via HTTP:", {
			url: `${API_BASE_URL}/api/auth/user`,
			profile: profile,
		});

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

		const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(profile),
			signal: controller.signal,
		}).finally(() => clearTimeout(timeoutId));

		if (!response.ok) {
			const error = await response.json();
			throw new ApiClientError(
				error.error?.message || "Failed to upsert user",
				response.status,
				error.error?.code
			);
		}

		return await response.json();
	} catch (error) {
		console.error("Error upserting user:", error);
		throw error;
	}
}

/**
 * メールアドレスからユーザー情報を取得
 *
 * @param email - ユーザーのメールアドレス
 * @returns ユーザー情報またはnull
 */
export async function getUserByEmail(email: string) {
	try {
		// Service Bindingが利用可能かチェック
		const serviceBinding = getServiceBinding();

		if (serviceBinding) {
			console.log("🔍 Using Service Binding for getUserByEmail API");

			// Service Bindingを使用したリクエスト
			const request = new Request(
				`https://backend/api/auth/user/${encodeURIComponent(email)}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			const response = await serviceBinding.fetch(request);

			if (response.status === 404) {
				return null;
			}

			if (!response.ok) {
				const error = await response.json();
				throw new ApiClientError(
					error.error?.message || "Failed to get user",
					response.status,
					error.error?.code
				);
			}

			return await response.json();
		}

		// Service Bindingが利用できない場合は通常のfetch
		const response = await fetch(
			`${API_BASE_URL}/api/auth/user/${encodeURIComponent(email)}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			const error = await response.json();
			throw new ApiClientError(
				error.error?.message || "Failed to get user",
				response.status,
				error.error?.code
			);
		}

		return await response.json();
	} catch (error) {
		console.error("Error getting user:", error);
		throw error;
	}
}
