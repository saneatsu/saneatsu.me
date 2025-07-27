// @ts-nocheck - React 19 compatibility issue with react-markdown
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import type { Article } from "../../../shared";

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

	return (
		<main className="container mx-auto px-4 py-8">
			<article className="max-w-4xl mx-auto">
				{/* Article Header */}
				<header className="mb-12 space-y-6">
					<div className="space-y-4">
						<div className="flex items-center space-x-4 text-sm text-muted-foreground">
							{publishedDate && (
								<time dateTime={article.publishedAt || undefined}>
									{t("publishedAt")}: {publishedDate}
								</time>
							)}
							<span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
								{article.status === "published"
									? locale === "ja"
										? "公開"
										: "Published"
									: locale === "ja"
										? "下書き"
										: "Draft"}
							</span>
						</div>

						<h1 className="text-4xl font-bold tracking-tight">
							{article.title}
						</h1>
					</div>
				</header>

				{/* Article Content */}
				<div className="prose prose-neutral dark:prose-invert max-w-none">
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						rehypePlugins={[rehypeHighlight]}
						components={{
							h1: ({ children }) => (
								<h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
							),
							h2: ({ children }) => (
								<h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>
							),
							h3: ({ children }) => (
								<h3 className="text-xl font-medium mt-4 mb-2">{children}</h3>
							),
							p: ({ children }) => (
								<p className="mb-4 text-muted-foreground leading-relaxed">
									{children}
								</p>
							),
							ul: ({ children }) => (
								<ul className="mb-4 ml-6 list-disc space-y-1">{children}</ul>
							),
							ol: ({ children }) => (
								<ol className="mb-4 ml-6 list-decimal space-y-1">{children}</ol>
							),
							li: ({ children }) => (
								<li className="text-muted-foreground">{children}</li>
							),
							code: ({ children, className }) => {
								const isInline = !className;
								if (isInline) {
									return (
										<code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
											{children}
										</code>
									);
								}
								return <code className={className}>{children}</code>;
							},
							pre: ({ children }) => (
								<pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
									{children}
								</pre>
							),
							blockquote: ({ children }) => (
								<blockquote className="border-l-4 border-border pl-4 italic my-4">
									{children}
								</blockquote>
							),
						}}
					>
						{article.content}
					</ReactMarkdown>
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
			</article>
		</main>
	);
}
