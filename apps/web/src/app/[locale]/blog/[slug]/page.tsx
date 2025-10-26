import type { Metadata } from "next";
import { headers } from "next/headers";

import { extractDescription, fetchArticle, getOgImageUrl } from "@/shared/lib";
import { ArticleDetailWrapper } from "@/views";

interface ArticlePageProps {
	params: Promise<{
		locale: string;
		slug: string;
	}>;
}

/**
 * 記事詳細ページのメタデータを生成
 *
 * @description
 * OGP（Open Graph Protocol）対応のメタデータを生成する。
 * X（Twitter）やFacebookなどのSNSでシェアされた時に適切な情報が表示される。
 *
 * 生成される情報:
 * 1. タイトル: 記事タイトル + サイト名
 * 2. 説明文: 記事本文から抽出（160文字）
 * 3. OGP画像: Cloudflare Imagesまたはデフォルト画像
 * 4. 公開日時
 * 5. 記事URL
 */
export async function generateMetadata({
	params,
}: ArticlePageProps): Promise<Metadata> {
	const { locale, slug } = await params;

	try {
		// 記事データを取得
		const articleResponse = await fetchArticle(slug, {
			lang: locale as "ja" | "en",
		});
		const article = articleResponse.data;

		// 記事本文から説明文を抽出
		const description = extractDescription(article.content || "", 160);

		// リクエストヘッダーからホスト情報を取得
		// ngrok経由でのテスト時に正しいURLを生成するため
		const headersList = await headers();
		const host = headersList.get("host");
		const protocol = host?.includes("localhost") ? "http" : "https";
		const baseUrl = host
			? `${protocol}://${host}`
			: process.env.NEXT_PUBLIC_SITE_URL || "https://saneatsu.me";
		const articleUrl = `${baseUrl}/${locale}/blog/${slug}`;

		// OGP画像URLを取得
		const ogImageUrl = getOgImageUrl(article.cfImageId, locale, slug, baseUrl);

		return {
			title: `${article.title} - saneatsu.me`,
			description,
			openGraph: {
				title: article.title || "",
				description,
				type: "article",
				publishedTime: article.publishedAt || undefined,
				url: articleUrl,
				images: [
					{
						url: ogImageUrl,
						width: 1200,
						height: 630,
						alt: article.title || "",
					},
				],
				locale: locale === "ja" ? "ja_JP" : "en_US",
			},
			twitter: {
				card: "summary_large_image",
				site: "@saneatsu_wakana",
				creator: "@saneatsu_wakana",
				title: article.title || "",
				description,
				images: [ogImageUrl],
			},
		};
	} catch (error) {
		// 記事が見つからない場合やエラーが発生した場合はデフォルトのメタデータを返す
		console.error("Failed to generate metadata for article:", error);

		// リクエストヘッダーからホスト情報を取得
		const headersList = await headers();
		const host = headersList.get("host");
		const protocol = host?.includes("localhost") ? "http" : "https";
		const baseUrl = host
			? `${protocol}://${host}`
			: process.env.NEXT_PUBLIC_SITE_URL || "https://saneatsu.me";

		const defaultDescription =
			locale === "ja"
				? "プログラミング、開発ツール、日常の気づきなど、技術とライフスタイルに関する記事を発信しています。"
				: "Articles about programming, development tools, and daily insights on technology and lifestyle.";

		return {
			title: "Article Not Found - saneatsu.me",
			description: defaultDescription,
			openGraph: {
				title: "Article Not Found",
				description: defaultDescription,
				type: "website",
				url: `${baseUrl}/${locale}`,
				images: [
					{
						url: `${baseUrl}/${locale}/opengraph-image`,
						width: 1200,
						height: 630,
						alt: "saneatsu.me",
					},
				],
				locale: locale === "ja" ? "ja_JP" : "en_US",
			},
			twitter: {
				card: "summary_large_image",
				site: "@saneatsu_wakana",
				creator: "@saneatsu_wakana",
				title: "Article Not Found",
				description: defaultDescription,
				images: [`${baseUrl}/${locale}/opengraph-image`],
			},
		};
	}
}

/**
 * 記事詳細ページ
 *
 * @description
 * 個別の記事を表示するページ。
 * slugパラメータに基づいて記事を取得し表示する。
 */
export default async function ArticlePage({ params }: ArticlePageProps) {
	const { locale, slug } = await params;

	return <ArticleDetailWrapper locale={locale} slug={slug} />;
}
