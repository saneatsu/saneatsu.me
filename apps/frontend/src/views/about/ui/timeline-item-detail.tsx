"use client";

import { useLocale, useTranslations } from "next-intl";
import type { SimpleIcon } from "simple-icons";

import type { TimelineItem } from "@/shared/types";
import { BadgeWithIcon, Separator } from "@/shared/ui";

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
 * @param from - 開始日（YYYY-MM形式または年のみ）
 * @param to - 終了日（YYYY-MM形式、年のみ、またはnull）
 * @param locale - ロケール（"ja" | "en"）
 * @returns フォーマットされた期間文字列
 */
function formatPeriod(
	from: string,
	to: string | null,
	locale: string
): string {
	if (to === null) {
		return locale === "ja" ? `${from} - 現在` : `${from} - Present`;
	}
	return `${from} - ${to}`;
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
			{/* 会社名セクション */}
			<div>
				<h2 className="text-2xl font-bold">{item.title}</h2>
			</div>

			<Separator />

			{/* 期間セクション */}
			<div>
				<h3 className="text-sm font-semibold text-muted-foreground mb-2">
					{t("experience.detail.period")}
				</h3>
				<p className="text-base">
					{formatPeriod(item.period.from, item.period.to, locale)}
				</p>
			</div>

			<Separator />

			{/* 職種・業務内容セクション */}
			<div>
				<h3 className="text-sm font-semibold text-muted-foreground mb-2">
					{t("experience.detail.description")}
				</h3>
				<p className="text-base whitespace-pre-line">{item.description}</p>
			</div>

			{/* 技術スタックセクション */}
			{item.techStack && item.techStack.length > 0 && (
				<>
					<Separator />
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
				</>
			)}
		</div>
	);
}
