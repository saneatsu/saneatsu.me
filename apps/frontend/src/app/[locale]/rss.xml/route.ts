import { NextResponse } from "next/server";

import { extractDescription, fetchArticles } from "@/shared/lib";

const SUPPORTED_LOCALES = ["ja", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_LANGUAGE_MAP: Record<Locale, string> = {
	ja: "ja-JP",
	en: "en-US",
};

const FEED_METADATA: Record<Locale, { title: string; description: string }> = {
	ja: {
		title: "saneatsu.me (日本語)",
		description:
			"プログラミング、開発ツール、日常の気づきなど、技術とライフスタイルに関する記事を発信しています。",
	},
	en: {
		title: "saneatsu.me (English)",
		description:
			"Articles about programming, development tools, and daily insights on technology and lifestyle.",
	},
};

const ATOM_NAMESPACE = "http://www.w3.org/2005/Atom";

export const dynamic = "force-dynamic";

function isValidLocale(locale: string): locale is Locale {
	return SUPPORTED_LOCALES.includes(locale as Locale);
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function wrapCdata(value: string): string {
	const safeValue = value.replace("]]>", "]]]]><![CDATA[>");
	return `<![CDATA[${safeValue}]]>`;
}

export async function GET(
	request: Request,
	context: { params: { locale: string } }
) {
	const { locale } = context.params;

	if (!isValidLocale(locale)) {
		return new NextResponse("Invalid locale", { status: 404 });
	}

	const requestUrl = new URL(request.url);
	const baseUrl =
		process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
		`${requestUrl.protocol}//${requestUrl.host}`;

	const feedMeta = FEED_METADATA[locale];
	const channelLink = `${baseUrl}/${locale}`;
	const selfUrl = `${channelLink}/rss.xml`;

	const articlesResponse = await fetchArticles({
		page: "1",
		limit: "20",
		lang: locale,
		status: "published",
		sortBy: "publishedAt",
		sortOrder: "desc",
	});

	const items = (articlesResponse.data || [])
		.filter((article) => article.publishedAt)
		.map((article) => {
			const title = article.title || article.slug;
			const link = `${baseUrl}/${locale}/blog/${article.slug}`;
			const description = article.content
				? extractDescription(article.content, 280)
				: "";
			const publishedAt =
				article.publishedAt || article.updatedAt || new Date().toISOString();

			return {
				title,
				link,
				description,
				pubDate: new Date(publishedAt).toUTCString(),
			};
		});

	const lastBuildDate = items[0]?.pubDate || new Date().toUTCString();

	const rssItems = items
		.map(
			(item) => `
		<item>
			<title>${wrapCdata(item.title)}</title>
			<link>${escapeXml(item.link)}</link>
			<guid isPermaLink="false">${escapeXml(item.link)}</guid>
			<pubDate>${escapeXml(item.pubDate)}</pubDate>
			<description>${wrapCdata(item.description)}</description>
		</item>`
		)
		.join("\n");

	const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="${ATOM_NAMESPACE}">
	<channel>
		<title>${wrapCdata(feedMeta.title)}</title>
		<link>${escapeXml(channelLink)}</link>
		<description>${wrapCdata(feedMeta.description)}</description>
		<language>${escapeXml(LOCALE_LANGUAGE_MAP[locale])}</language>
		<lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>
		<atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
		${rssItems}
	</channel>
</rss>`;

	return new NextResponse(feed, {
		status: 200,
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=0, s-maxage=900",
		},
	});
}
