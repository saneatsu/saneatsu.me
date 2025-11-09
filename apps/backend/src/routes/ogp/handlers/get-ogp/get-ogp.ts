import type { RouteHandler } from "@hono/zod-openapi";
import { Parser } from "htmlparser2";

import type { Env } from "@/env";

import type { getOgpRoute } from "./get-ogp.openapi";

type Handler = RouteHandler<typeof getOgpRoute, { Bindings: Env }>;

/**
 * HTMLからOGP情報を抽出する型定義
 */
interface OgpMetaTags {
	ogTitle?: string;
	ogDescription?: string;
	ogImage?: string;
	ogUrl?: string;
	ogSiteName?: string;
	favicon?: string;
	title?: string;
	description?: string;
}

/**
 * 相対URLを絶対URLに変換
 *
 * @param baseUrl - ベースとなるURL
 * @param relativeUrl - 変換する相対URL（または絶対URL）
 * @returns 絶対URL、または変換に失敗した場合はnull
 */
const toAbsoluteUrl = (
	baseUrl: string,
	relativeUrl: string | null | undefined
): string | null => {
	if (!relativeUrl) return null;

	try {
		// 既に絶対URLの場合はそのまま返す
		new URL(relativeUrl);
		return relativeUrl;
	} catch {
		// 相対URLの場合、baseUrlと結合
		try {
			return new URL(relativeUrl, baseUrl).toString();
		} catch {
			return null;
		}
	}
};

/**
 * AmazonのURLかどうかを判定
 *
 * @param url - 判定対象のURL
 * @returns AmazonのURLの場合true
 */
const isAmazonUrl = (url: string): boolean => {
	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname.toLowerCase();
		return (
			hostname.includes("amazon.co.jp") ||
			hostname.includes("amazon.com") ||
			hostname.includes("amzn.to")
		);
	} catch {
		return false;
	}
};

/**
 * 楽天のURLかどうかを判定
 *
 * @param url - 判定対象のURL
 * @returns 楽天のURLの場合true
 */
const isRakutenUrl = (url: string): boolean => {
	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname.toLowerCase();
		return (
			hostname.includes("rakuten.co.jp") ||
			hostname.includes("r10.to") ||
			hostname.includes("a.r10.to") ||
			hostname.includes("hb.afl.rakuten.co.jp") ||
			hostname.includes("pt.afl.rakuten.co.jp")
		);
	} catch {
		return false;
	}
};

/**
 * バイナリデータから文字コードを判定
 *
 * @description
 * 1. Content-Typeヘッダーから文字コードを取得
 * 2. HTMLのmetaタグから文字コードを取得（正規表現でcharsetを検索）
 * 3. どちらも見つからない場合はUTF-8をデフォルトとする
 *
 * @param buffer - HTMLのバイナリデータ
 * @param contentType - Content-Typeヘッダーの値
 * @returns 判定された文字コード（小文字）
 */
const detectCharsetFromBuffer = (
	buffer: ArrayBuffer,
	contentType: string | null
): string => {
	// 1. Content-Typeヘッダーから文字コードを取得
	if (contentType) {
		const charsetMatch = contentType.match(/charset=([^;\s]+)/i);
		if (charsetMatch) {
			return charsetMatch[1].toLowerCase();
		}
	}

	// 2. HTMLのmetaタグから文字コードを取得
	// バイナリデータの最初の1024バイトをASCII互換として読み込み
	const headerBytes = new Uint8Array(buffer.slice(0, 1024));
	const header = new TextDecoder("ascii").decode(headerBytes);

	// <meta charset="..."> または <meta http-equiv="Content-Type" content="...; charset=...">
	const charsetPatterns = [
		/<meta\s+charset=["']?([^"'\s>]+)/i,
		/<meta\s+http-equiv=["']?content-type["']?\s+content=["'][^"']*charset=([^"'\s;]+)/i,
	];

	for (const pattern of charsetPatterns) {
		const match = header.match(pattern);
		if (match) {
			return match[1].toLowerCase();
		}
	}

	// 3. デフォルトはUTF-8
	return "utf-8";
};

/**
 * HTMLのバイナリデータを適切な文字コードでデコード
 *
 * @description
 * TextDecoder (Web標準API) を使用して文字コード変換を行う。
 * Cloudflare Workers環境でも動作する。
 *
 * @param buffer - HTMLのバイナリデータ
 * @param contentType - Content-Typeヘッダーの値
 * @returns デコードされたHTML文字列
 */
const decodeHtmlBuffer = (
	buffer: ArrayBuffer,
	contentType: string | null
): string => {
	const charset = detectCharsetFromBuffer(buffer, contentType);

	// TextDecoderでデコード（Web標準API）
	try {
		const decoder = new TextDecoder(charset);
		return decoder.decode(buffer);
	} catch (_err) {
		// サポートされていない文字コードの場合はUTF-8にフォールバック
		console.warn(`Unsupported charset: ${charset}, falling back to UTF-8`);
		const decoder = new TextDecoder("utf-8");
		return decoder.decode(buffer);
	}
};

/**
 * HTMLからOGP情報を抽出
 *
 * @param html - パース対象のHTML
 * @returns 抽出されたOGP情報
 */
const parseOgpFromHtml = (html: string): OgpMetaTags => {
	const metaTags: OgpMetaTags = {};
	let isInTitle = false;
	let titleText = "";

	const parser = new Parser(
		{
			onopentag(name, attributes) {
				if (name === "meta") {
					const property = attributes.property || attributes.name;
					const content = attributes.content;

					if (!property || !content) return;

					// OGPタグの抽出
					switch (property) {
						case "og:title":
							metaTags.ogTitle = content;
							break;
						case "og:description":
							metaTags.ogDescription = content;
							break;
						case "og:image":
							metaTags.ogImage = content;
							break;
						case "og:url":
							metaTags.ogUrl = content;
							break;
						case "og:site_name":
							metaTags.ogSiteName = content;
							break;
						case "description":
							metaTags.description = content;
							break;
					}
				} else if (name === "link") {
					const rel = attributes.rel;
					const href = attributes.href;

					// faviconの抽出
					if (
						rel &&
						href &&
						(rel === "icon" ||
							rel === "shortcut icon" ||
							rel === "apple-touch-icon")
					) {
						if (!metaTags.favicon) {
							metaTags.favicon = href;
						}
					}
				} else if (name === "title") {
					isInTitle = true;
					titleText = "";
				}
			},
			ontext(text) {
				if (isInTitle) {
					titleText += text;
				}
			},
			onclosetag(name) {
				if (name === "title" && isInTitle) {
					metaTags.title = titleText.trim();
					isInTitle = false;
				}
			},
		},
		{ decodeEntities: true }
	);

	parser.write(html);
	parser.end();

	// Amazon専用: data-a-dynamic-imageから画像URLを抽出
	if (!metaTags.ogImage && html.includes("data-a-dynamic-image")) {
		try {
			const dynamicImageMatch = html.match(/data-a-dynamic-image="([^"]+)"/);
			if (dynamicImageMatch) {
				// HTMLエンティティをデコード
				const imageData = dynamicImageMatch[1]
					.replace(/&quot;/g, '"')
					.replace(/&amp;/g, "&")
					.replace(/&lt;/g, "<")
					.replace(/&gt;/g, ">");

				// JSONをパース
				const imageObj = JSON.parse(imageData);

				// 最初の画像URLを取得（最大解像度のものを選択）
				const imageUrls = Object.keys(imageObj);
				if (imageUrls.length > 0) {
					// 解像度が最大のものを選択（サイズの配列の最初の要素で比較）
					const sortedUrls = imageUrls.sort((a, b) => {
						const sizeA = imageObj[a][0] || 0;
						const sizeB = imageObj[b][0] || 0;
						return sizeB - sizeA;
					});
					metaTags.ogImage = sortedUrls[0];
				}
			}
		} catch (err) {
			console.error("Failed to parse Amazon image data:", err);
		}
	}

	return metaTags;
};

/**
 * GET /api/ogp - OGP情報取得
 *
 * @description
 * 1. クエリパラメータからURLを取得
 * 2. fetchを使用してHTMLを取得
 * 3. htmlparser2を使用してOGP情報をパース
 * 4. 取得したOGP情報を整形してレスポンス
 * 5. エラーハンドリング（無効なURL、取得失敗）
 */
export const getOgp: Handler = async (c) => {
	try {
		// 1. クエリパラメータからURLを取得
		const { url } = c.req.valid("query");

		// 2. fetchを使用してHTMLを取得
		// 基本的なブラウザヘッダーを設定
		const headers: Record<string, string> = {
			"User-Agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
			Accept:
				"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
			"Accept-Language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
			"Cache-Control": "no-cache",
		};

		// Amazon URLの場合、追加のヘッダーを送信（ボット検出を回避）
		// Referer: リファラーを設定して、Amazon.co.jpからのアクセスに見せかける
		// Sec-Fetch-*: ブラウザの通常のナビゲーションリクエストであることを示す
		if (isAmazonUrl(url)) {
			headers.Referer = "https://www.amazon.co.jp/";
			headers["Accept-Encoding"] = "gzip, deflate, br";
			headers["Sec-Fetch-Dest"] = "document";
			headers["Sec-Fetch-Mode"] = "navigate";
			headers["Sec-Fetch-Site"] = "none";
			headers["Upgrade-Insecure-Requests"] = "1";
		}

		const response = await fetch(url, { headers });

		if (!response.ok) {
			return c.json(
				{
					error: {
						code: "OGP_FETCH_ERROR",
						message: "Failed to fetch OGP data from the provided URL",
					},
				},
				500
			);
		}

		// URLに応じて適切な方法でHTMLを取得
		let html: string;

		if (isAmazonUrl(url)) {
			// Amazonの場合：response.text()を使用（変更前の方法）
			html = await response.text();
		} else if (isRakutenUrl(url)) {
			// 楽天の場合：arrayBuffer() + TextDecoderを使用（文字化け対策）
			const buffer = await response.arrayBuffer();
			const contentType = response.headers.get("content-type");
			html = decodeHtmlBuffer(buffer, contentType);
		} else {
			// その他：デフォルトはresponse.text()
			html = await response.text();
		}

		// 3. htmlparser2を使用してOGP情報をパース
		const metaTags = parseOgpFromHtml(html);

		// 4. 取得したOGP情報を整形してレスポンス
		return c.json(
			{
				data: {
					title: metaTags.ogTitle || metaTags.title || null,
					description: metaTags.ogDescription || metaTags.description || null,
					image: toAbsoluteUrl(url, metaTags.ogImage),
					favicon: toAbsoluteUrl(url, metaTags.favicon),
					siteName: metaTags.ogSiteName || null,
					url: metaTags.ogUrl || url,
				},
			},
			200
		);
	} catch (err) {
		// 5. エラーハンドリング
		console.error("OGP fetch error:", err);
		return c.json(
			{
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An error occurred while fetching OGP data",
				},
			},
			500
		);
	}
};
