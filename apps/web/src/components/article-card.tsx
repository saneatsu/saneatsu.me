import Link from "next/link";
import type { Article } from "../types/api";

interface ArticleCardProps {
	article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
	const publishedDate = article.publishedAt
		? new Date(article.publishedAt).toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "long",
				day: "numeric",
		  })
		: null;

	return (
		<article className="group relative border rounded-lg p-6 hover:shadow-md transition-shadow">
			<div className="flex flex-col space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium" style={{backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))'}}>
							{article.status === "published" ? "公開" : "下書き"}
						</span>
					</div>
					{publishedDate && (
						<time className="text-sm" style={{color: 'hsl(var(--muted-foreground))'}}>
							{publishedDate}
						</time>
					)}
				</div>

				<div>
					<h3 className="font-semibold text-lg transition-colors group-hover:text-blue-600">
						<Link href={`/articles/${article.slug}`}>
							<span className="absolute inset-0" />
							{article.title}
						</Link>
					</h3>
				</div>

				<div className="text-sm line-clamp-3" style={{color: 'hsl(var(--muted-foreground))'}}>
					{article.content
						.replace(/^#.*$/gm, "") // Remove headers
						.replace(/```[\s\S]*?```/g, "") // Remove code blocks
						.replace(/[#*`]/g, "") // Remove markdown syntax
						.trim()
						.slice(0, 150)}
					...
				</div>

				<div className="flex items-center justify-between text-sm" style={{color: 'hsl(var(--muted-foreground))'}}>
					<Link
						href={`/articles/${article.slug}`}
						className="font-medium hover:underline" style={{color: 'hsl(var(--primary))'}}
					>
						続きを読む →
					</Link>
				</div>
			</div>
		</article>
	);
}