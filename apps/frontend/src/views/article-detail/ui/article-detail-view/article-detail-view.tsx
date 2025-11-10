// @ts-nocheck - React 19 compatibility issue with react-markdown
"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import rehypeHighlight from "rehype-highlight";

import { RelatedArticles } from "@/features/article-management";
import type { Article } from "@/shared";
import { extractHeadings, formatRelativeDate, getImageUrl } from "@/shared/lib";
import {
	Badge,
	MarkdownPreview,
	ShareButtons,
	TableOfContents,
} from "@/shared/ui";

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
 * 記事のヘッダー、本文、フッターを含む。
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

	return (
		<main className="container mx-auto px-4 py-8">
			<article className="max-w-6xl mx-auto">
				{/* Article Header */}
				<header className="mb-12 space-y-6">
					<div className="space-y-4">
						<h1 className="text-2xl font-bold tracking-tight">
							{article.title}
						</h1>

						{/* タグ表示 */}
						{article.tags && article.tags.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{article.tags.map((tag) => (
									<Badge key={tag.id} variant="outline">
										{tag.translations[locale as "ja" | "en"]}
									</Badge>
								))}
							</div>
						)}

						<div className="flex items-center space-x-4 text-sm text-muted-foreground">
							{publishedDate && (
								<time dateTime={article.publishedAt || undefined}>
									{t("publishedAt")}: {publishedDate}
								</time>
							)}
							{updatedDateInfo && (
								<time dateTime={article.updatedAt || undefined}>
									{t("updatedAt")}:{" "}
									{updatedDateInfo.isRelative
										? updatedDateInfo.minutes !== undefined
											? updatedDateInfo.minutes === 0
												? t("justNow")
												: t("minutesAgo", { minutes: updatedDateInfo.minutes })
											: updatedDateInfo.hours !== undefined
												? t("hoursAgo", { hours: updatedDateInfo.hours })
												: t("daysAgo", { days: updatedDateInfo.days })
										: updatedDateInfo.formatted}
								</time>
							)}
							{/* 閲覧数表示（一時的にコメントアウト）
							<span className="flex items-center space-x-1">
								<svg
									className="h-3 w-3"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
									aria-label="閲覧数"
								>
									<title>閲覧数</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
								<span>{t("viewCount", { count: article.viewCount })}</span>
							</span>
							*/}
						</div>

						{/* サムネイル画像 */}
						{article.cfImageId && (
							<div className="relative max-w-lg aspect-video rounded-lg overflow-hidden bg-muted">
								<Image
									src={getImageUrl(article.cfImageId, "large")}
									alt={article.title || "記事のサムネイル"}
									fill
									className="object-cover"
									sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 1200px"
									priority
								/>
							</div>
						)}
					</div>
				</header>

				{/* Main Content Area - 2 Column Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
					<div className="min-w-0 order-2 lg:order-1">
						{/* シェアボタン（上部） */}
						<div className="flex justify-end">
							<ShareButtons url={articleUrl} title={article.title || ""} />
						</div>

						{/* Article Content */}
						<MarkdownPreview
							content={article.content || ""}
							language={locale as "ja" | "en"}
							className="prose-neutral"
							rehypePlugins={[rehypeHighlight]}
							imageComponent="zoomable"
							headings={headings}
						/>

						{/* シェアボタン（下部） */}
						<div className="mt-12 flex justify-end">
							<ShareButtons url={articleUrl} title={article.title || ""} />
						</div>
					</div>

					{/* Table of Contents Sidebar */}
					<aside className="order-1 lg:order-2 lg:sticky lg:top-20 lg:h-fit lg:w-[300px]">
						<div className="rounded-lg border bg-card p-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
							<TableOfContents
								headings={headings}
								title={t("tableOfContents")}
							/>
						</div>
					</aside>
				</div>

				{/* Related Articles Section */}
				<section className="mt-16 pt-8 border-t">
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
