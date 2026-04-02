import { env } from "@/env";

/**
 * GA4のgtagグローバル関数の型定義
 *
 * @description
 * Google Analytics 4のgtag.jsが提供するグローバル関数の型。
 * `config` コマンドでページビュー計測、`event` コマンドでカスタムイベント送信に使用する。
 */
type GtagFunction = {
	(
		command: "config",
		targetId: string,
		params?: Record<string, string | number>
	): void;
	(
		command: "event",
		eventName: string,
		params?: Record<string, string | number>
	): void;
};

declare global {
	interface Window {
		gtag?: GtagFunction;
	}
}

/**
 * GA4にカスタムイベントを送信する
 *
 * @description
 * window.gtagをラップした型安全なイベント送信関数。
 * GA測定IDが未設定の場合やgtagが未読み込みの場合は何もしない（開発環境対応）。
 *
 * @param eventName - GA4イベント名
 * @param params - イベントに付与するパラメータ
 */
export function trackEvent(
	eventName: string,
	params?: Record<string, string | number>
): void {
	if (!env.NEXT_PUBLIC_GA_ID) return;
	if (typeof window === "undefined" || typeof window.gtag === "undefined")
		return;

	window.gtag("event", eventName, params);
}
