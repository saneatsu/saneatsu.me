"use client";

import { usePathname } from "next/navigation";
import type { Options } from "nuqs";
import { useQueryStates } from "nuqs";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * SSR対応のuseLayoutEffect
 */
const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

// biome-ignore lint/suspicious/noExplicitAny: nuqsのパーサー型は複雑なため、anyを使用
export function usePersistentQueryStates<TParsers extends Record<string, any>>(
	storageKey: string,
	parsers: TParsers,
	options?: Options
): ReturnType<typeof useQueryStates<TParsers>> {
	const pathname = usePathname();
	const [params, setParams] = useQueryStates(parsers, options);
	const hasRestoredRef = useRef(false);
	const isFirstRenderRef = useRef(true);
	const restoredValueRef = useRef<string | null>(null);

	/**
	 * pathnameが変わったら、復元フラグと復元値をリセット
	 */
	useIsomorphicLayoutEffect(() => {
		hasRestoredRef.current = false;
		restoredValueRef.current = null;
		console.log(
			`[${storageKey}] pathname changed to:`,
			pathname,
			"- reset restore flag"
		);
	}, [pathname, storageKey]);

	/**
	 * URLパラメータが空の場合、localStorageから復元
	 */
	useIsomorphicLayoutEffect(() => {
		if (typeof window === "undefined") return;
		if (hasRestoredRef.current) {
			console.log(`[${storageKey}] Already restored, skipping`);
			return;
		}

		try {
			const saved = localStorage.getItem(storageKey);
			console.log(`[${storageKey}] localStorage value:`, saved);

			if (!saved) return;

			const savedParams = JSON.parse(saved);
			console.log(`[${storageKey}] Parsed saved params:`, savedParams);

			const hasUrlParams = window.location.search.length > 0;
			console.log(
				`[${storageKey}] window.location.search:`,
				window.location.search,
				"hasUrlParams:",
				hasUrlParams
			);

			if (!hasUrlParams && savedParams) {
				console.log(
					`[${storageKey}] Restoring from localStorage:`,
					savedParams
				);
				// 復元した値を保存（この値と同じ間は保存をスキップする）
				restoredValueRef.current = saved;
				setParams(savedParams, { history: "replace" });
				hasRestoredRef.current = true;
				console.log(
					`[${storageKey}] Set restored value to prevent overwrite during stabilization`
				);
			} else {
				console.log(
					`[${storageKey}] Skipping restore (hasUrlParams:${hasUrlParams})`
				);
			}
		} catch (error) {
			console.warn(
				`Failed to restore state from localStorage: ${storageKey}`,
				error
			);
		}
	}, [storageKey, setParams, pathname]);

	/**
	 * パラメータ変更時: localStorageに保存
	 */
	useEffect(() => {
		if (isFirstRenderRef.current) {
			isFirstRenderRef.current = false;
			return;
		}

		if (typeof window === "undefined") return;

		try {
			const currentValue = JSON.stringify(params);

			// 復元した値と同じ場合はスキップ（まだ安定していない）
			if (restoredValueRef.current === currentValue) {
				console.log(
					`[${storageKey}] Skipping save (same as restored value, still stabilizing)`
				);
				return;
			}

			// 復元した値と異なる場合は、復元フラグをクリア（ユーザーが変更した）
			if (restoredValueRef.current !== null) {
				console.log(
					`[${storageKey}] Value changed from restored value, clearing restored flag`
				);
				restoredValueRef.current = null;
			}

			console.log(`[${storageKey}] Saving to localStorage:`, params);
			localStorage.setItem(storageKey, currentValue);
		} catch (error) {
			console.warn(
				`Failed to save state to localStorage: ${storageKey}`,
				error
			);
		}
	}, [storageKey, params]);

	return [params, setParams];
}
