"use client";

import type { Locale } from "@saneatsu/i18n";
import { useLocale, useTranslations } from "next-intl";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { SimpleIcon } from "simple-icons";

import type { TimelineItem } from "@/shared/types";
import { BadgeWithIcon, MarkdownPreview, Separator } from "@/shared/ui";

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
 * TimelineItemDetailコンポーネント
 *
 * @description
 * タイムラインアイテムの詳細情報を表示するコンポーネント。
 * SheetやDialog内で使用することを想定している。
 */
export function TimelineItemDetail({ item }: TimelineItemDetailProps) {
	const t = useTranslations("about");
	const locale = useLocale() as Locale;

	/**
	 * 期間を文字列にフォーマットする関数
	 *
	 * @param from - 開始日（YYYY-MM形式または年のみ）
	 * @param to - 終了日（YYYY-MM形式、年のみ、またはnull）
	 * @returns フォーマットされた期間文字列
	 */
	const formatPeriod = (from: string, to: string | null): string => {
		if (to === null) {
			return `${from} - ${t("experience.detail.present")}`;
		}
		return `${from} - ${to}`;
	};

	/**
	 * カテゴリを翻訳された文字列に変換する関数
	 *
	 * @param category - カテゴリ
	 * @returns 翻訳されたカテゴリ名
	 */
	const getCategoryLabel = (category: TimelineItem["category"]): string => {
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
				<h2 className="text-2xl font-bold flex items-center gap-3">
					{item.logoUrl && (
						<img
							src={item.logoUrl}
							alt={`${item.companyName} logo`}
							className="w-8 h-8 object-contain shrink-0"
						/>
					)}
					<span>{item.companyName}</span>
				</h2>
			</div>

			<Separator />

			{/* 期間セクション */}
			<div>
				<h3 className="text-sm font-semibold text-muted-foreground mb-2">
					{t("experience.detail.period")}
				</h3>
				<p className="text-base">
					{formatPeriod(item.period.from, item.period.to)}
				</p>
			</div>

			{/* 役職セクション */}
			{item.role && item.role.length > 0 && (
				<>
					<Separator />
					<div>
						<h3 className="text-sm font-semibold text-muted-foreground mb-2">
							{t("experience.detail.role")}
						</h3>
						<div className="flex flex-wrap gap-2">
							{item.role.map((r, index) => (
								<span key={index} className="text-base">
									{r}
									{index < item.role!.length - 1 && (
										<span className="text-muted-foreground mx-1">/</span>
									)}
								</span>
							))}
						</div>
					</div>
				</>
			)}

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
								<BadgeWithIcon key={tech.slug} icon={tech} text={tech.title} />
							))}
						</div>
					</div>
				</>
			)}

			<Separator />

			{/* 職種・業務内容セクション */}
			<div>
				<h3 className="text-sm font-semibold text-muted-foreground mb-2">
					{t("experience.detail.description")}
				</h3>
				<MarkdownPreview
					content={item.description}
					language={locale}
					className="prose-sm"
					remarkPlugins={[remarkGfm, remarkBreaks]}
				/>
			</div>
		</div>
	);
}
