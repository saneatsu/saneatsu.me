import { notFound } from "next/navigation";
import { fetchArticle } from "@/shared/lib";
import { ArticleDetailView } from "./article-detail-view";

interface ArticleDetailWrapperProps {
	slug: string;
	locale: string;
}

/**
 * 記事詳細ビューのラッパーコンポーネント
 *
 * @description
 * 記事データの取得を行い、ArticleDetailViewに渡す。
 * サーバーコンポーネントとして動作する。
 *
 * @param props.slug - 記事のスラッグ
 * @param props.locale - 現在のロケール
 */
export async function ArticleDetailWrapper({
	slug,
	locale,
}: ArticleDetailWrapperProps) {
	try {
		const articleResponse = await fetchArticle(slug, {
			lang: locale as "ja" | "en",
		});

		return <ArticleDetailView article={articleResponse.data} locale={locale} />;
	} catch (error) {
		console.error("❌ Failed to fetch article:", {
			error,
			message: error instanceof Error ? error.message : "Unknown error",
			slug,
			locale,
		});

		notFound();
	}
}
