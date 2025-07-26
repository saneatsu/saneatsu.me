import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Article } from "../../../shared";
import { Button } from "../../../shared/ui/button/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../../../shared/ui/card/card";

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
	const excerpt = article.content
		.replace(/^#.*$/gm, "") // ヘッダーを削除
		.replace(/```[\s\S]*?```/g, "") // コードブロックを削除
		.replace(/[#*`]/g, "") // マークダウン記法を削除
		.trim()
		.slice(0, 150);

	return (
		<Card className="group hover:shadow-md transition-shadow">
			<CardHeader>
				<div className="flex items-center justify-between mb-2">
					{publishedDate && (
						<time className="text-sm text-muted-foreground">
							{publishedDate}
						</time>
					)}
				</div>
				<CardTitle className="line-clamp-2">
					<Link 
						href={`/articles/${article.slug}`}
						className="hover:text-primary transition-colors"
					>
						{article.title}
					</Link>
				</CardTitle>
			</CardHeader>
			
			<CardContent>
				<p className="text-sm text-muted-foreground line-clamp-3">
					{excerpt}...
				</p>
			</CardContent>
			
			<CardFooter>
				<Link href={`/articles/${article.slug}`}>
					<Button
						variant="ghost"
						size="sm"
						className="p-0 h-auto font-medium text-primary hover:text-primary/80"
					>
						{`${t("readMore")} →`}
					</Button>
				</Link>
			</CardFooter>
		</Card>
	);
}
