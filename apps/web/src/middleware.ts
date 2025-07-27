import { type NextRequest, NextResponse } from "next/server";
import { defaultLocale } from "./shared/config/locale-constants";

const locales = ["ja", "en"] as const;

/**
 * Accept-Languageヘッダーから適切な言語を検出する
 *
 * @description
 * ブラウザが送信するAccept-Languageヘッダーを解析し、
 * サポートされている言語から最適なものを選択する。
 *
 * 処理の流れ:
 * 1. Accept-Languageヘッダーを解析
 * 2. 優先度（qValue）でソート
 * 3. サポートされている言語とマッチング
 * 4. マッチしない場合はデフォルト言語を返す
 *
 * @param acceptLanguage - Accept-Languageヘッダーの値
 * @returns 検出された言語コード
 */
function detectLocaleFromAcceptLanguage(acceptLanguage: string): string {
	if (!acceptLanguage) return defaultLocale;

	// Accept-Language: ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7 のような形式を解析
	const languages = acceptLanguage
		.split(",")
		.map((lang) => {
			const [locale, qValue] = lang.trim().split(";");
			const quality = qValue
				? Number.parseFloat(qValue.replace("q=", ""))
				: 1.0;
			return {
				// ja-JP → ja のように言語コードのみ抽出
				locale: locale.toLowerCase().split("-")[0],
				quality,
			};
		})
		.sort((a, b) => b.quality - a.quality);

	// サポートされている言語をチェック
	for (const { locale } of languages) {
		if (locales.includes(locale as (typeof locales)[number])) {
			return locale;
		}
	}

	return defaultLocale;
}

/**
 * パスからロケールを取得する
 *
 * @param pathname - URLのパス名
 * @returns ロケールまたはundefined
 */
function getLocaleFromPath(pathname: string): string | undefined {
	const segments = pathname.split("/");
	const locale = segments[1];

	if (locales.includes(locale as (typeof locales)[number])) {
		return locale;
	}

	return undefined;
}

/**
 * Next.jsのミドルウェア関数
 *
 * @description
 * URLベースの多言語ルーティングを実装する。
 *
 * 処理の流れ:
 * 1. URLにロケールが含まれているかチェック
 * 2. 含まれていない場合、Accept-Languageヘッダーから言語を検出
 * 3. 適切なロケールを含むURLにリダイレクト
 *
 * @param request - Next.jsのリクエストオブジェクト
 * @returns レスポンスオブジェクト
 */
export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	// パスからロケールを取得
	const pathnameLocale = getLocaleFromPath(pathname);

	// ロケールがURLに含まれている場合は何もしない
	if (pathnameLocale) {
		return NextResponse.next();
	}

	// Accept-Languageヘッダーから言語を検出
	const acceptLanguage = request.headers.get("accept-language") || "";
	const detectedLocale = detectLocaleFromAcceptLanguage(acceptLanguage);

	// ロケールを含むURLにリダイレクト
	const newUrl = new URL(request.url);
	newUrl.pathname = `/${detectedLocale}${pathname}`;

	return NextResponse.redirect(newUrl);
}

/**
 * ミドルウェアの設定
 *
 * @description
 * matcherパターンで指定されたパスのみミドルウェアが実行される。
 * 以下のパスは除外される：
 * - /api/* : APIルート
 * - /_next/* : Next.jsの内部ルート
 * - /favicon.ico : ファビコン
 * - 静的ファイル（画像など）
 */
export const config = {
	matcher: [
		// すべてのパスに適用（除外パターンを除く）
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
