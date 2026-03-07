// @ts-nocheck - React 19 compatibility issue with react-markdown
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";

import { RelatedArticles } from "@/features/article-management";
import type { Article } from "@/shared";
import { extractHeadings, formatRelativeDate } from "@/shared/lib";

import { ArticleContent } from "./article-content";
import { ArticleHeader } from "./article-header";

export interface ArticleDetailViewProps {
	/** 表示する記事データ */
	article: Article;
	/** 現在のロケール */
	locale: string;
}

/**
 * 記事詳細ページのメインビューコンポーネント
 *
 * @description
 * 個別記事の詳細を表示するビューコンポーネント。
 * 記事のヘッダー、本文、関連記事を組み立てるオーケストレーター。
 *
 * @param props.article - 表示する記事データ
 * @param props.locale - 現在のロケール（後方互換性のため残しているが、内部では useLocale() を使用）
 */
export function ArticleDetailView({
	article,
	locale: _locale,
}: ArticleDetailViewProps) {
	const locale = useLocale();
	const t = useTranslations("article");
	const tShare = useTranslations("share");

	const publishedDate = article.publishedAt
		? new Date(article.publishedAt).toLocaleDateString(
				locale === "ja" ? "ja-JP" : "en-US",
				{
					year: "numeric",
					month: "long",
					day: "numeric",
				}
			)
		: null;

	// 更新日の相対日付フォーマット
	const updatedDateInfo = formatRelativeDate(
		article.updatedAt ?? null,
		locale as "ja" | "en"
	);

	// Markdownから見出しを抽出
	const headings = extractHeadings(article.content || "");

	// 記事のURLを生成（SSR時はフォールバック、CSR時はwindow.location.originを使用）
	const baseUrl =
		typeof window !== "undefined"
			? window.location.origin
			: "https://saneatsu.me";
	const articleUrl = `${baseUrl}/blog/${article.slug}`;

	/**
	 * 記事のMarkdownコンテンツをクリップボードにコピーする
	 */
	const handleCopyMarkdown = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(article.content || "");
			toast.success(tShare("copyMarkdown"));
		} catch {
			toast.error(tShare("copyMarkdownError"));
		}
	}, [article.content, tShare]);

	return (
		<main className="container mx-auto px-4 py-6">
			<article className="max-w-6xl mx-auto space-y-8">
				<ArticleHeader
					article={article}
					locale={locale as "ja" | "en"}
					publishedDate={publishedDate}
					updatedDateInfo={updatedDateInfo}
					t={t}
				/>

				<ArticleContent
					article={article}
					locale={locale as "ja" | "en"}
					articleUrl={articleUrl}
					headings={headings}
					onCopyMarkdown={handleCopyMarkdown}
					tShare={tShare}
					t={t}
				/>

				{/* 関連記事セクション */}
				<section className="pt-8 border-t">
					<div className="max-w-5xl mx-auto">
						<h2 className="text-xl font-bold mb-6">
							{t("relatedArticles.title")}
						</h2>
						<RelatedArticles slug={article.slug} limit={10} />
					</div>
				</section>
			</article>
		</main>
	);
}
