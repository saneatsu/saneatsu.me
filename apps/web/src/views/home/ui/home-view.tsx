import { useTranslations } from "next-intl";

import { ArticlesList } from "@/widgets";

/**
 * ホームページのメインビューコンポーネント
 *
 * @description
 * ブログのホームページを表示するビューコンポーネント。
 * ヒーローセクションと記事一覧を含む。
 */
export function HomeView() {
	const t = useTranslations("home");

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto space-y-12">
				{/* Hero Section */}
				<section className="text-center space-y-4">
					<h1 className="text-4xl font-bold">{t("hero.title")}</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						{t("hero.description")}
					</p>
				</section>

				{/* Articles Section */}
				<section>
					<h2 className="text-2xl font-bold mb-6">{t("articles.title")}</h2>
					<ArticlesList limit={6} />
				</section>
			</div>
		</main>
	);
}
