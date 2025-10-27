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
		const response = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; OGPBot/1.0; +https://saneatsu.me/)",
			},
		});

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

		const html = await response.text();

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
