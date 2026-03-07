"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import type { Article } from "@/shared";
import { formatRelativeDate, getImageUrl } from "@/shared/lib";
import { Badge } from "@/shared/ui";

interface ArticleHeaderProps {
	/** 記事データ */
	article: Article;
}

/**
 * 記事ヘッダーコンポーネント
 *
 * @description
 * 記事のタイトル、タグ、公開日・更新日、サムネイル画像を表示する。
 * ロケールや翻訳、日付フォーマットは内部で取得・計算する。
 */
export function ArticleHeader({ article }: ArticleHeaderProps) {
	const locale = useLocale() as "ja" | "en";
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
	const updatedDateInfo = formatRelativeDate(article.updatedAt ?? null, locale);

	return (
		<header className="space-y-4">
			<h1 className="text-2xl font-bold tracking-tight">{article.title}</h1>

			{/* タグ表示 */}
			{article.tags && article.tags.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{article.tags.map((tag) => (
						<Badge key={tag.id} variant="outline">
							{tag.translations[locale]}
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
									: t("daysAgo", { days: updatedDateInfo.days ?? 0 })
							: updatedDateInfo.formatted}
					</time>
				)}
			</div>

			{/* サムネイル画像 */}
			{article.cfImageId && (
				<div className="relative max-w-lg aspect-video rounded-lg overflow-hidden bg-muted">
					<Image
						src={getImageUrl(article.cfImageId, "large")}
						alt={article.title}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 1200px"
						priority
					/>
				</div>
			)}
		</header>
	);
}
