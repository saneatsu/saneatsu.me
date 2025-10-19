import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import type { Article } from "@/shared";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card/card";

interface ArticleCardProps {
	article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
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

	// コンテンツから本文の抜粋を生成
	const excerpt = (article.content || "")
		.replace(/^#.*$/gm, "") // ヘッダーを削除
		.replace(/```[\s\S]*?```/g, "") // コードブロックを削除
		.replace(/[#*`]/g, "") // マークダウン記法を削除
		.trim()
		.slice(0, 150);

	return (
		<Link href={`/articles/${article.slug}`}>
			<Card className="group hover:shadow-md transition-shadow cursor-pointer">
				<CardHeader>
					<div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
						{publishedDate && <time>{publishedDate}</time>}
						<div className="flex items-center space-x-1">
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
						</div>
					</div>
					<CardTitle className="line-clamp-2">
						<span className="group-hover:underline transition-all">
							{article.title}
						</span>
					</CardTitle>
				</CardHeader>

				<CardContent>
					<p className="text-sm text-muted-foreground line-clamp-3">
						{excerpt}...
					</p>
				</CardContent>
			</Card>
		</Link>
	);
}
