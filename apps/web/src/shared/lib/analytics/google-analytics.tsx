import Script from "next/script";

import { env } from "@/env";

/**
 * Google Analytics 4のトラッキングスクリプト
 *
 * @description
 * Google Analytics 4のgtag.jsスクリプトを読み込み、初期化する。
 * 測定IDが設定されていない場合（開発環境など）は何も表示しない。
 *
 * @remarks
 * 1. 環境変数から測定IDを取得
 * 2. 測定IDが設定されていれば、gtagスクリプトを読み込む
 * 3. gtagの初期化とページビュー計測の設定
 *
 * @example
 * ```tsx
 * // layout.tsxで使用
 * <html>
 *   <GoogleAnalytics />
 *   <body>...</body>
 * </html>
 * ```
 */
export function GoogleAnalytics() {
	// 測定IDが設定されていない場合は何も表示しない
	const measurementId = env.NEXT_PUBLIC_GA_ID;
	if (!measurementId) {
		return null;
	}

	return (
		<>
			{/* Google Analytics スクリプトの読み込み */}
			<Script
				src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
				strategy="afterInteractive"
			/>

			{/* Google Analytics の初期化 */}
			<Script id="google-analytics" strategy="afterInteractive">
				{`
					window.dataLayer = window.dataLayer || [];
					function gtag(){dataLayer.push(arguments);}
					gtag('js', new Date());
					gtag('config', '${measurementId}', {
						page_path: window.location.pathname,
					});
				`}
			</Script>
		</>
	);
}
