"use client";

import type { AppType } from "@saneatsu/backend";
import { hc } from "hono/client";

/**
 * APIのベースURL
 * 環境変数から取得（必須）
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
	throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
}

/**
 * 共通のHono Clientインスタンス
 *
 * @description
 * アプリケーション全体で使用する統一されたAPIクライアント。
 * バックエンドのAppTypeに基づいて型安全性を提供する。
 *
 * @example
 * ```tsx
 * import { honoClient } from "@/shared/lib/hono-client";
 *
 * // 記事一覧取得
 * const response = await honoClient.api.articles.$get({
 *   query: { language: "ja", limit: "10" }
 * });
 * ```
 */
export const honoClient = hc<AppType>(API_BASE_URL) as any;

/**
 * APIベースURLを取得するヘルパー関数
 *
 * @returns APIのベースURL
 */
export const getApiBaseUrl = (): string => API_BASE_URL;
