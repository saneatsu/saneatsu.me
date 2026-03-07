import Image from "next/image";
import type { useTranslations } from "next-intl";

import type { Article } from "@/shared";
import type { RelativeDateResult } from "@/shared/lib";
import { getImageUrl } from "@/shared/lib";
import { Badge } from "@/shared/ui";

interface ArticleHeaderProps {
	/** 記事データ */
	article: Article;
	/** 現在のロケール */
	locale: "ja" | "en";
	/** フォーマット済みの公開日 */
	publishedDate: string | null;
	/** 相対日付情報 */
	updatedDateInfo: RelativeDateResult | undefined;
	/** 記事翻訳関数 */
	t: ReturnType<typeof useTranslations<"article">>;
}

/**
 * 記事ヘッダーコンポーネント
 *
 * @description
 * 記事のタイトル、タグ、公開日・更新日、サムネイル画像を表示する。
 */
export function ArticleHeader({
	article,
	locale,
	publishedDate,
	updatedDateInfo,
	t,
}: ArticleHeaderProps) {
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
						alt={article.title || "記事のサムネイル"}
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
