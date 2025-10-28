"use server";

import type { Locale } from "@saneatsu/i18n";
import { defaultLocale } from "@saneatsu/i18n";
import { cookies } from "next/headers";

/**
 * ロケール設定のCookie名
 */
const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/**
 * ロケール（言語設定）はCookieから読み取られます。
 *
 * 代替案として、データベース、バックエンドサービス、その他のソースから読み取ることも可能です。
 */

export async function getUserLocale(): Promise<Locale> {
	const cookieStore = await cookies();
	return (
		(cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale) || defaultLocale
	);
}

export async function setUserLocale(locale: Locale) {
	const cookieStore = await cookies();
	cookieStore.set(LOCALE_COOKIE_NAME, locale);
}
