import { notFound } from "next/navigation";
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
	// 記事データの取得
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
	const response = await fetch(
		`${apiUrl}/api/articles/${slug}?lang=${locale}`,
		{
			next: { revalidate: 60 },
			cache: "no-store", // 開発中は常に最新のデータを取得
		}
	);

	if (!response.ok) {
		notFound();
	}

	const article = await response.json();

	return <ArticleDetailView article={article} locale={locale} />;
}
