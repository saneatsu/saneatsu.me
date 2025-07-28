import { useTranslations } from "next-intl";
import { ArticlesList } from "../../../widgets";

/**
 * 記事一覧ページ
 *
 * @description
 * すべての記事を表示する一覧ページ。
 * ページネーションとフィルタリング機能を含む。
 */
export default function ArticlesPage() {
	const t = useTranslations();

	return (
		<main className="container mx-auto px-4 py-8 space-y-6">
			<h1 className="text-4xl font-bold">{t("navigation.blog")}</h1>
			<ArticlesList />
		</main>
	);
}
