import { useTranslations } from "next-intl";

import { BlogNotice } from "@/shared/ui";
import { ArticlesList } from "@/widgets";

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
		<main className="container mx-auto px-4 py-8">
			<div className="max-w-5xl mx-auto space-y-6">
				<section className="text-center">
					<h1 className="text-4xl font-bold">{t("blog.title")}</h1>
				</section>

				{/* Blog運営方針 */}
				<BlogNotice />

				<ArticlesList />
			</div>
		</main>
	);
}
