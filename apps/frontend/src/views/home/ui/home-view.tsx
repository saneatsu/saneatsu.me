"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/shared/lib";
import { BlogNotice, PageContainer } from "@/shared/ui";
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
 * コンテンツ幅は PageContainer に集約し、Blog・Aboutページと揃えている。
 */
export function HomeView() {
	const t = useTranslations("home");

	return (
		<PageContainer className="space-y-16">
			{/*
				トップページを3つのブロックに大きく分ける。
				ブロック間は space-y-16（PageContainer 側で指定）の余白だけで
				区切る（罫線は引かない）。人気記事と最新記事は同じ「記事」
				ブロックにまとめ、内部だけ space-y で分ける。
			*/}
			{/* ブロック1: 自己紹介ヒーロー */}
			<section className="space-y-5">
				{/* 大見出し: サイズに応じて字間を詰める（Appleの光学的なトラッキング） */}
				<h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-[-0.02em]">
					{t("hero.title")}
				</h1>
				<p className="text-base leading-relaxed text-foreground">
					{t("hero.description")}
				</p>
				{/* Aboutページへの導線（お問い合わせと同じ塗りボタン） */}
				<div className="flex flex-wrap items-center gap-x-4 gap-y-3">
					<span className="text-sm text-muted-foreground">
						{t("hero.aboutPrompt")}
					</span>
					<Link
						href="/about"
						className="group inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
					>
						{t("hero.aboutLink")}
						<ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
					</Link>
				</div>
				{/* お仕事相談への導線（Contactページへ誘導） */}
				<div className="flex flex-wrap items-center gap-x-4 gap-y-3">
					<span className="text-sm text-muted-foreground">
						{t("hero.contactPrompt")}
					</span>
					<Link
						href="/contact"
						className="group inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
					>
						{t("hero.contactLink")}
						<ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
					</Link>
				</div>
			</section>

			{/* ブロック2: このブログについて（運営方針） */}
			<BlogNotice />

			{/* ブロック3: 記事（人気 + 最新） */}
			<div className="space-y-12">
				{/* Popular Articles Section */}
				<section>
					<h2 className="mb-6 text-2xl font-bold tracking-tight">
						{t("popularArticles.title")}
					</h2>
					<PopularArticlesList />
				</section>

				{/* Latest Articles Section */}
				<section>
					<h2 className="mb-6 text-2xl font-bold tracking-tight">
						{t("articles.title")}
					</h2>
					<ArticlesList limit={6} />
				</section>
			</div>
		</PageContainer>
	);
}
