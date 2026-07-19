import { useTranslations } from "next-intl";

import { BlogNotice, PageContainer } from "@/shared/ui";
import { ArticlesList, TagFilter } from "@/widgets";

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
		<PageContainer className="space-y-6">
			<section className="text-center">
				<h1 className="text-4xl font-bold">{t("blog.title")}</h1>
			</section>

			{/* Blog運営方針 */}
			<BlogNotice />

			{/* タグフィルター */}
			<TagFilter />

			<ArticlesList />
		</PageContainer>
	);
}
