"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { articlesService } from "../services/articles";
import type { Article } from "../types/api";
import { ArticleCard } from "./article-card";

interface ArticlesListProps {
	lang?: string;
}

export function ArticlesList({ lang }: ArticlesListProps = {}) {
	const locale = useLocale();
	const t = useTranslations();
	const currentLang = lang || locale;

	const [articles, setArticles] = useState<Article[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchArticles() {
			try {
				setLoading(true);
				const response = await articlesService.getArticles({
					lang: currentLang,
					limit: 10,
				});
				setArticles(response.data);
			} catch (err) {
				setError(err instanceof Error ? err.message : t("error.message"));
			} finally {
				setLoading(false);
			}
		}

		fetchArticles();
	}, [currentLang, t]);

	if (loading) {
		return (
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }, (_, i) => ({
					id: `skeleton-${Date.now()}-${i}`,
				})).map((item) => (
					<div
						key={item.id}
						className="animate-pulse border rounded-lg p-6 space-y-3"
					>
						<div className="flex justify-between items-center">
							<div className="h-5 bg-muted rounded w-16" />
							<div className="h-4 bg-muted rounded w-20" />
						</div>
						<div className="h-6 bg-muted rounded w-3/4" />
						<div className="space-y-2">
							<div className="h-4 bg-muted rounded" />
							<div className="h-4 bg-muted rounded" />
							<div className="h-4 bg-muted rounded w-2/3" />
						</div>
						<div className="h-4 bg-muted rounded w-24" />
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-12">
				<div className="text-destructive text-lg font-medium mb-2">
					{t("error.title")}
				</div>
				<p className="text-muted-foreground">{error}</p>
				<button
					type="button"
					onClick={() => window.location.reload()}
					className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
				>
					{t("error.retry")}
				</button>
			</div>
		);
	}

	if (articles.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="text-lg font-medium mb-2">
					{locale === "ja" ? "記事がありません" : "No articles found"}
				</div>
				<p className="text-muted-foreground">
					{locale === "ja"
						? "まだ公開された記事がありません。"
						: "No published articles yet."}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">
					{locale === "ja" ? "最新の記事" : "Latest Articles"}
				</h2>
				<div className="text-sm text-muted-foreground">
					{articles.length}
					{locale === "ja" ? "件の記事" : " articles"}
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{articles.map((article) => (
					<ArticleCard key={article.id} article={article} />
				))}
			</div>
		</div>
	);
}
