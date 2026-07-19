"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/shared/lib";
import { BlogNotice } from "@/shared/ui";
import { ArticlesList, PopularArticlesList } from "@/widgets";

/**
 * ホームページのメインビューコンポーネント
 *
 * @description
 * トップページを表示するビューコンポーネント。
 * 1. 自己紹介ヒーロー（肩書き・プロフィール・お仕事相談への導線）
 * 2. ブログ運営方針（BlogNotice）
 * 3. 人気記事一覧
 * 4. 最新記事一覧
 *
 * ヒーローはサイトの「軽い名刺」として振る舞い、詳しい技術スタックや経歴は
 * Aboutページに委ねている。ブログの発見性は人気・最新記事一覧で担保する。
 */
export function HomeView() {
	const t = useTranslations("home");

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="max-w-5xl mx-auto space-y-12">
				{/* Hero Section（自己紹介） */}
				<section className="space-y-4">
					<h1 className="text-3xl font-bold tracking-tight">
						{t("hero.title")}
					</h1>
					<p className="text-foreground leading-relaxed">
						{t("hero.description")}
					</p>
					{/* お仕事相談への導線（Contactページへ誘導） */}
					<p className="flex flex-wrap items-center gap-2 text-foreground">
						<span>{t("hero.contactPrompt")}</span>
						<Link
							href="/contact"
							className="inline-flex items-center gap-1 font-semibold text-foreground underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground"
						>
							{t("hero.contactLink")}
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</p>
				</section>

				{/* Blog運営方針 */}
				<BlogNotice />

				{/* Popular Articles Section */}
				<section>
					<h2 className="text-2xl font-bold mb-6">
						{t("popularArticles.title")}
					</h2>
					<PopularArticlesList />
				</section>

				{/* Latest Articles Section */}
				<section>
					<h2 className="text-2xl font-bold mb-6">{t("articles.title")}</h2>
					<ArticlesList limit={6} />
				</section>
			</div>
		</main>
	);
}
