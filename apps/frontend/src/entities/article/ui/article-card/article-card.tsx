import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { TagBadge } from "@/entities/tag";
import type { Article } from "@/shared";
import {
	formatRelativeDate,
	getArticleEmoji,
	getCloudflareImageUrl,
} from "@/shared/lib";
import { Link } from "@/shared/lib/navigation";

interface ArticleCardProps {
	article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
	const locale = useLocale();
	const t = useTranslations("article");

	// 更新日の相対日付フォーマット
	const updatedDateInfo = formatRelativeDate(
		article.updatedAt ?? null,
		locale as "ja" | "en"
	);

	// コンテンツから本文の抜粋を生成
	const excerpt = (article.content || "")
		.replace(/^#.*$/gm, "") // ヘッダーを削除
		.replace(/```[\s\S]*?```/g, "") // コードブロックを削除
		.replace(/[#*`]/g, "") // マークダウン記法を削除
		.trim()
		.slice(0, 150);

	return (
		<Link href={`/blog/${article.slug}`}>
			<div className="group cursor-pointer flex flex-row items-start gap-4">
				{/* サムネイル画像またはフォールバック */}
				<div className="relative w-28 md:w-40 aspect-video overflow-hidden rounded-md shrink-0">
					{article.cfImageId ? (
						<Image
							src={getCloudflareImageUrl(article.cfImageId, "medium") ?? ""}
							alt={article.title ?? ""}
							fill
							className="object-cover transition-transform group-hover:scale-105"
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						/>
					) : (
						<div className="w-full h-full bg-muted flex items-center justify-center">
							<span className="text-5xl">{getArticleEmoji(article.id)}</span>
						</div>
					)}
				</div>

				{/* コンテンツ部分 */}
				{/*
					break-all: モバイルで長いURL・英数字の連続が右にはみ出さないように強制改行
					break-words（単語境界のみ改行）では不十分なため、任意の文字で改行するbreak-allを使用
				*/}
				<div className="flex-1 flex flex-col py-0 min-w-0">
					<h3 className="text-sm md:text-base font-semibold line-clamp-3 mb-2 group-hover:underline transition-all break-all">
						{article.title}
					</h3>

					<p className="text-xs text-muted-foreground line-clamp-2 mb-2 break-all">
						{excerpt}...
					</p>

					{/* タグと更新日を表示 */}
					<div className="flex items-center gap-2 flex-wrap">
						{/* タグ表示（最大3つまで） */}
						{article.tags.length > 0 && (
							<div className="flex gap-1 flex-wrap">
								{article.tags.slice(0, 3).map((tag) => (
									<TagBadge key={tag.id} tag={tag} />
								))}
								{article.tags.length > 3 && (
									<span className="text-xs text-muted-foreground">
										+{article.tags.length - 3}
									</span>
								)}
							</div>
						)}

						{/* 更新日 */}
						{updatedDateInfo && (
							<time className="text-xs text-muted-foreground">
								{t("updatedAt")}:{" "}
								{updatedDateInfo.isRelative
									? updatedDateInfo.minutes !== undefined
										? updatedDateInfo.minutes === 0
											? t("justNow")
											: t("minutesAgo", { minutes: updatedDateInfo.minutes })
										: updatedDateInfo.hours !== undefined
											? t("hoursAgo", { hours: updatedDateInfo.hours })
											: updatedDateInfo.days !== undefined
												? t("daysAgo", { days: updatedDateInfo.days })
												: updatedDateInfo.formatted
									: updatedDateInfo.formatted}
							</time>
						)}
					</div>
				</div>
			</div>
		</Link>
	);
}
