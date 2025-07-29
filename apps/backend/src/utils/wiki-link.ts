import { articles, articleTranslations, db } from "@saneatsu/db";
import { and, eq, inArray } from "drizzle-orm";

/**
 * Wiki Linkの情報
 */
export interface WikiLinkInfo {
	/** 元のslug */
	slug: string;
	/** 記事のタイトル（言語に応じた） */
	title: string | null;
	/** リンク先のURL */
	url: string;
}

/**
 * Wiki Link形式（[[slug]]）を検出する正規表現
 */
const WIKI_LINK_PATTERN = /\[\[([a-z0-9-]+)\]\]/g;

/**
 * コンテンツ内のWiki Linkを検出
 *
 * @description
 * Markdownコンテンツ内の[[slug]]形式のテキストを検出し、
 * 重複を除いたslugの配列を返す。
 *
 * @param content - Markdownコンテンツ
 * @returns 検出されたslugの配列（重複なし）
 */
export function extractWikiLinks(content: string): string[] {
	const slugs = new Set<string>();
	const matches = content.matchAll(WIKI_LINK_PATTERN);

	for (const match of matches) {
		slugs.add(match[1]);
	}

	return Array.from(slugs);
}

/**
 * slugから記事情報を取得
 *
 * @description
 * 指定されたslugの配列から、対応する記事のタイトルを取得する。
 * 存在しない記事の場合はnullを返す。
 *
 * @param slugs - 取得する記事のslug配列
 * @param language - 言語（ja/en）
 * @returns slug→WikiLinkInfoのマップ
 */
export async function fetchArticleInfoBySlugs(
	slugs: string[],
	language: "ja" | "en"
): Promise<Map<string, WikiLinkInfo>> {
	if (slugs.length === 0) {
		return new Map();
	}

	// slugsから記事情報を取得
	const articleInfos = await db
		.select({
			slug: articles.slug,
			title: articleTranslations.title,
			status: articles.status,
		})
		.from(articles)
		.leftJoin(
			articleTranslations,
			and(
				eq(articles.id, articleTranslations.articleId),
				eq(articleTranslations.language, language)
			)
		)
		.where(inArray(articles.slug, slugs));

	// slug→WikiLinkInfoのマップを作成
	const linkInfoMap = new Map<string, WikiLinkInfo>();

	for (const slug of slugs) {
		const articleInfo = articleInfos.find((info) => info.slug === slug);

		if (articleInfo && articleInfo.status === "published") {
			// 公開済み記事の場合のみリンクを生成
			linkInfoMap.set(slug, {
				slug,
				title: articleInfo.title,
				url: `/${language}/articles/${slug}`,
			});
		} else {
			// 記事が存在しない、または未公開の場合
			linkInfoMap.set(slug, {
				slug,
				title: null,
				url: `/${language}/articles/${slug}`,
			});
		}
	}

	return linkInfoMap;
}

/**
 * コンテンツ内のWiki LinkをMarkdownリンクに変換
 *
 * @description
 * [[slug]]形式のテキストを[タイトル](/locale/articles/slug)形式に変換する。
 * 記事が存在しない場合は[[slug]]のまま残す。
 *
 * @param content - 変換前のMarkdownコンテンツ
 * @param language - 言語（ja/en）
 * @returns 変換後のMarkdownコンテンツ
 */
export async function convertWikiLinks(
	content: string,
	language: "ja" | "en"
): Promise<string> {
	// Wiki Linkを抽出
	const slugs = extractWikiLinks(content);

	if (slugs.length === 0) {
		return content;
	}

	// slug情報を取得
	const linkInfoMap = await fetchArticleInfoBySlugs(slugs, language);

	// Wiki LinkをMarkdownリンクに置換
	let convertedContent = content;

	for (const [slug, linkInfo] of linkInfoMap) {
		const wikiLinkPattern = new RegExp(`\\[\\[${slug}\\]\\]`, "g");

		if (linkInfo.title) {
			// 記事が存在する場合はMarkdownリンクに変換
			convertedContent = convertedContent.replace(
				wikiLinkPattern,
				`[${linkInfo.title}](${linkInfo.url})`
			);
		}
		// titleがnullの場合（記事が存在しない、または未公開）は変換しない
	}

	return convertedContent;
}
