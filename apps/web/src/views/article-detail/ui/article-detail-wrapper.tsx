import { notFound } from "next/navigation";
import { ArticleDetailView } from "./article-detail-view";
import type { ArticleResponse } from "../../../shared/types/article";

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
	// 記事データの取得
	const apiUrl = process.env.NODE_ENV === 'development' 
		? 'http://localhost:8888' 
		: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
	
	try {
		const response = await fetch(
			`${apiUrl}/api/articles/${slug}?lang=${locale}`,
			{
				next: { revalidate: 60 },
				headers: {
					"Accept-Language": locale,
				},
			}
		);

		if (!response.ok) {
			notFound();
		}

		const articleResponse: ArticleResponse = await response.json();

		return <ArticleDetailView article={articleResponse.data} locale={locale} />;
	} catch (error) {
		console.error("Failed to fetch article:", error);
		notFound();
	}
}
