"use client";

import { useLocale, useTranslations } from "next-intl";
import type { SimpleIcon } from "simple-icons";

import type { TimelineItem } from "../../types";
import { BadgeWithIcon } from "../../ui";

/**
 * TimelineItemDetailコンポーネントのProps
 */
export type TimelineItemDetailProps = {
	/**
	 * 表示するタイムラインアイテム
	 */
	item: TimelineItem;
};

/**
 * 期間を文字列にフォーマットする関数
 *
 * @param start - 開始日（YYYY-MM形式または年のみ）
 * @param end - 終了日（YYYY-MM形式、年のみ、またはnull）
 * @param locale - ロケール（"ja" | "en"）
 * @returns フォーマットされた期間文字列
 */
function formatPeriod(
	start: string,
	end: string | null,
	locale: string
): string {
	if (end === null) {
		return locale === "ja" ? `${start} - 現在` : `${start} - Present`;
	}
	return `${start} - ${end}`;
}

/**
 * TimelineItemDetailコンポーネント
 *
 * @description
 * タイムラインアイテムの詳細情報を表示するコンポーネント。
 * SheetやDialog内で使用することを想定している。
 */
export function TimelineItemDetail({ item }: TimelineItemDetailProps) {
	const t = useTranslations("about");
	const locale = useLocale();

	/**
	 * カテゴリを翻訳された文字列に変換する関数
	 *
	 * @param category - カテゴリ
	 * @returns 翻訳されたカテゴリ名
	 */
	const getCategoryLabel = (
		category: TimelineItem["category"]
	): string => {
		const categoryMap: Record<TimelineItem["category"], string> = {
			work: t("experience.category.work"),
			education: t("experience.category.education"),
			project: t("experience.category.project"),
			skill: t("experience.category.skill"),
		};
		return categoryMap[category];
	};

	return (
		<div className="space-y-6">
			{/* タイトル */}
			<div>
				<h2 className="text-2xl font-bold">{item.title}</h2>
			</div>

			{/* 期間 */}
			<div>
				<h3 className="text-sm font-semibold text-muted-foreground mb-1">
					{t("experience.detail.period")}
				</h3>
				<p className="text-base">
					{formatPeriod(item.period.start, item.period.end, locale)}
				</p>
			</div>

			{/* カテゴリ */}
			<div>
				<h3 className="text-sm font-semibold text-muted-foreground mb-1">
					{t("experience.detail.category")}
				</h3>
				<p className="text-base">{getCategoryLabel(item.category)}</p>
			</div>

			{/* 説明 */}
			<div>
				<h3 className="text-sm font-semibold text-muted-foreground mb-1">
					{t("experience.detail.description")}
				</h3>
				<p className="text-base whitespace-pre-line">{item.description}</p>
			</div>

			{/* 技術スタック */}
			{item.techStack && item.techStack.length > 0 && (
				<div>
					<h3 className="text-sm font-semibold text-muted-foreground mb-2">
						{t("experience.detail.techStack")}
					</h3>
					<div className="flex flex-wrap gap-2">
						{item.techStack.map((tech: SimpleIcon) => (
							<BadgeWithIcon
								key={tech.slug}
								icon={tech}
								text={tech.title}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
