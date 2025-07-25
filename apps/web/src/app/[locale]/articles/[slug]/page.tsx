import { notFound } from "next/navigation";
import { articlesService } from "../../../../entities/article";
import { ArticleDetailView } from "../../../../views";

interface ArticlePageProps {
	params: Promise<{ slug: string; locale: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
	const { slug, locale } = await params;

	try {
		const article = await articlesService.getArticle(
			slug,
			locale as "ja" | "en"
		);

		return <ArticleDetailView article={article} locale={locale} />;
	} catch (error) {
		console.error("Failed to fetch article:", error);
		notFound();
	}
}
