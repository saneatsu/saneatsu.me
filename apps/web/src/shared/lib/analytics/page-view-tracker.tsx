"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { env } from "@/env";

/**
 * Google Analyticsにページビューを送信する関数
 *
 * @param url - ページのURL（パスとクエリパラメータを含む）
 *
 * @remarks
 * window.gtagが存在する場合のみ、ページビューイベントを送信する
 */
const sendPageView = (url: string) => {
	// @ts-expect-error gtagはグローバルに存在するが、型定義がないため
	if (typeof window.gtag !== "undefined") {
		// @ts-expect-error gtagはグローバルに存在するが、型定義がないため
		window.gtag("config", env.NEXT_PUBLIC_GA_ID, {
			page_path: url,
		});
	}
};

/**
 * ページビュー自動計測コンポーネント
 *
 * @description
 * Next.js App Routerでのクライアントサイドルーティングに対応したページビュー計測。
 * パス名やクエリパラメータが変更されるたびに、Google Analyticsにページビューを送信する。
 *
 * @remarks
 * 1. usePathnameとuseSearchParamsでルート変更を検知
 * 2. ルートが変更されたらsendPageView関数を呼び出し
 * 3. 測定IDが設定されていない場合はページビューを送信しない
 *
 * @example
 * ```tsx
 * // Providersコンポーネントやlayout.tsxで使用
 * <body>
 *   <PageViewTracker />
 *   {children}
 * </body>
 * ```
 */
export function PageViewTracker() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// パス名またはクエリパラメータが変更されたときにページビューを送信
	useEffect(() => {
		// 測定IDが設定されていない場合は何もしない
		if (!env.NEXT_PUBLIC_GA_ID) {
			return;
		}

		const url =
			pathname +
			(searchParams?.toString() ? `?${searchParams.toString()}` : "");
		sendPageView(url);
	}, [pathname, searchParams]);

	return null;
}
