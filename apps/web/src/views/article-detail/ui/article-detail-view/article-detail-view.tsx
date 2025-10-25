// @ts-nocheck - React 19 compatibility issue with react-markdown

import Image from "next/image";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { WikiLink } from "@/entities/article";
import type { Article } from "@/shared";
import {
	cn,
	extractHeadings,
	formatRelativeDate,
	getArticleEmoji,
	getImageUrl,
	remarkTag,
	remarkWikiLink,
} from "@/shared/lib";
import { Badge, TableOfContents, ZoomableImage } from "@/shared/ui";

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
 * @param props.locale - 現在のロケール（日付表示等で使用）
 */
export function ArticleDetailView({ article, locale }: ArticleDetailViewProps) {
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

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="max-w-6xl mx-auto">
				{/* Article Header */}
				<header className="mb-12 space-y-6">
					<div className="space-y-4">
						<h1 className="text-4xl font-bold tracking-tight">
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
										? updatedDateInfo.days === 0
											? t("today")
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

						{/* サムネイル画像またはフォールバック */}
						<div className="relative max-w-lg aspect-video rounded-lg overflow-hidden bg-muted">
							{article.cfImageId ? (
								<Image
									src={getImageUrl(article.cfImageId, "large")}
									alt={article.title || "記事のサムネイル"}
									fill
									className="object-cover"
									sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 1200px"
									priority
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center">
									<span className="text-9xl">
										{getArticleEmoji(article.id)}
									</span>
								</div>
							)}
						</div>
					</div>
				</header>

				{/* Main Content Area - 2 Column Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
					{/* Article Content */}
					<div className="min-w-0 order-2 lg:order-1">
						<article className="prose prose-neutral dark:prose-invert max-w-none">
							<ReactMarkdown
								remarkPlugins={[remarkGfm, remarkWikiLink, remarkTag]}
								rehypePlugins={[rehypeHighlight]}
								components={{
									h1: ({ children }) => (
										<h1
											id={
												extractHeadings(article.content || "").find(
													(h) => h.text === children?.toString()
												)?.id
											}
											className="text-3xl font-bold mt-8 mb-4 scroll-mt-8"
										>
											{children}
										</h1>
									),
									h2: ({ children }) => (
										<h2
											id={
												extractHeadings(article.content || "").find(
													(h) => h.text === children?.toString()
												)?.id
											}
											className="text-2xl font-semibold mt-6 mb-3 scroll-mt-8"
										>
											{children}
										</h2>
									),
									h3: ({ children }) => (
										<h3
											id={
												extractHeadings(article.content || "").find(
													(h) => h.text === children?.toString()
												)?.id
											}
											className="text-xl font-medium mt-4 mb-2 scroll-mt-8"
										>
											{children}
										</h3>
									),
									h4: ({ children }) => (
										<h4
											id={
												extractHeadings(article.content || "").find(
													(h) => h.text === children?.toString()
												)?.id
											}
											className="text-lg font-medium mt-3 mb-2 scroll-mt-8"
										>
											{children}
										</h4>
									),
									h5: ({ children }) => (
										<h5
											id={
												extractHeadings(article.content || "").find(
													(h) => h.text === children?.toString()
												)?.id
											}
											className="text-base font-medium mt-2 mb-1 scroll-mt-8"
										>
											{children}
										</h5>
									),
									h6: ({ children }) => (
										<h6
											id={
												extractHeadings(article.content || "").find(
													(h) => h.text === children?.toString()
												)?.id
											}
											className="text-sm font-medium mt-2 mb-1 scroll-mt-8"
										>
											{children}
										</h6>
									),
									p: ({ children }) => (
										<p className="mb-4 text-muted-foreground leading-relaxed">
											{children}
										</p>
									),
									ul: ({ children }) => (
										<ul className="mb-4 ml-6 list-disc space-y-1">
											{children}
										</ul>
									),
									ol: ({ children }) => (
										<ol className="mb-4 ml-6 list-decimal space-y-1">
											{children}
										</ol>
									),
									li: ({ children }) => (
										<li className="text-muted-foreground">{children}</li>
									),
									code: ({ children, className }) => {
										const isInline = !className;
										if (isInline) {
											return (
												<code className="bg-muted text-foreground px-1 py-0.5 rounded text-sm font-mono">
													{children}
												</code>
											);
										}
										return (
											<code className={cn(className, "text-foreground")}>
												{children}
											</code>
										);
									},
									pre: ({ children }) => (
										<pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto mb-4">
											{children}
										</pre>
									),
									blockquote: ({ children }) => (
										<blockquote className="border-l-4 border-border pl-4 italic my-4">
											{children}
										</blockquote>
									),
									a: ({ children, href, ...props }) => {
										// Wiki Linkの判定
										const className = props.className as string;
										const isWikiLink = className?.includes("wiki-link");

										// Wiki Linkの場合はカスタムコンポーネントを使用
										if (isWikiLink && href) {
											return (
												<WikiLink
													href={href}
													language={locale as "ja" | "en"}
													className={className}
													{...props}
												>
													{children}
												</WikiLink>
											);
										}

										// 通常のリンク
										return (
											<a
												href={href}
												className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
												{...props}
											>
												{children}
											</a>
										);
									},
									img: ({ src, alt }) => (
										<ZoomableImage src={src || ""} alt={alt || ""} />
									),
								}}
							>
								{article.content}
							</ReactMarkdown>
						</article>
					</div>

					{/* Table of Contents Sidebar */}
					<aside
						className={cn(
							"order-1 lg:order-2 lg:sticky lg:top-20 lg:h-fit lg:w-[300px]",
							headings.length === 0 && "hidden lg:block"
						)}
					>
						<div className="rounded-lg border bg-card p-6 shadow-sm lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
							<TableOfContents
								headings={headings}
								title={locale === "ja" ? "目次" : "Table of Contents"}
							/>
						</div>
					</aside>
				</div>

				{/* Article Footer */}
				<footer className="mt-12 pt-8 border-t">
					<div className="flex items-center justify-center">
						<a
							href={`/${locale}`}
							className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
						>
							← {t("backToList")}
						</a>
					</div>
				</footer>
			</div>
		</main>
	);
}
