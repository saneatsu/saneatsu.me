"use client";

import type { AppType } from "@saneatsu/backend";
import { hc } from "hono/client";
import { getSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useMemo } from "react";

import { env } from "@/env";

/**
 * Honoクライアントのラッパーフック
 *
 * Accept-Languageヘッダーを自動的に追加する
 * Authorizationヘッダーでアクセストークンを送信する
 *
 * useRootQueryClientではなく、ここで実装する理由:
 *
 * 1. 責務の分離
 *    - React Query (TanStack Query) はデータのキャッシュとステート管理に特化
 *    - HTTPリクエストの詳細（ヘッダー、認証など）はHTTPクライアント層で扱うべき
 * 2. React Queryの設計思想
 *    - QueryClientはHTTPリクエスト自体を行わない（fetcherに委譲）
 *    - グローバルなHTTPヘッダー設定機能を持たない
 *    - 各queryFn/mutationFnで個別にfetcherを定義する設計
 * 3. 柔軟性の確保
 *    - API呼び出しごとに異なるヘッダーが必要な場合に対応可能
 *    - Honoクライアント以外のHTTPクライアントも使用可能
 *    - 特定のエンドポイントだけヘッダーを変更することも容易
 * 4. 型安全性
 *    - Honoの型定義をそのまま活用できる
 *    - カスタムfetchでも型推論が正しく動作
 */
export function useHonoClient(): ReturnType<typeof hc<AppType>> {
	const locale = useLocale();

	// localeが変わるたびに新しいクライアントを作成
	return useMemo(() => {
		// カスタムfetchでヘッダーを追加
		const customFetch: typeof fetch = async (input, init) => {
			const headers = new Headers(init?.headers);
			headers.set("Accept-Language", locale);

			// NextAuthのセッションからユーザー情報を取得
			const session = await getSession();
			if (session?.user?.email) {
				// ログイン中のユーザーのメールアドレスをヘッダーに設定
				// バックエンドでログイン中のユーザーを識別し、閲覧数カウントから除外するために使用
				headers.set("X-User-Email", session.user.email);
			}

			return fetch(input, {
				...init,
				headers,
				credentials: "include", // Cookieも引き続き送信（fallback用）
			});
		};

		const apiUrl = env.NEXT_PUBLIC_API_URL;

		return hc<AppType>(apiUrl, { fetch: customFetch });
	}, [locale]);
}

// 型定義のエクスポート
export type HonoClient = ReturnType<typeof useHonoClient>;
