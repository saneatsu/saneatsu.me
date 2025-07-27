import { ArticleDetailView } from "../../../../views/article-detail";

interface ArticlePageProps {
	params: Promise<{
		locale: string;
		slug: string;
	}>;
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

	return <ArticleDetailView locale={locale} slug={slug} />;
}