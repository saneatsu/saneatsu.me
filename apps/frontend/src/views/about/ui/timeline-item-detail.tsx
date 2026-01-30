"use client";

import type { Locale } from "@saneatsu/i18n";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { SimpleIcon } from "simple-icons";

import { getTechIcon } from "@/shared/lib";
import type { TimelineItem } from "@/shared/types";
import {
	BadgeWithIcon,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	MarkdownPreview,
	Separator,
} from "@/shared/ui";

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

	return (
		<div className="space-y-6">
			{/* 会社名セクション */}
			<div>
				<h2 className="text-2xl font-bold flex items-center gap-3">
					{item.logoUrl && (
						<Image
							src={item.logoUrl}
							alt={`${item.companyName} logo`}
							width={32}
							height={32}
							className="object-contain shrink-0"
						/>
					)}
					<span>{item.companyName}</span>
				</h2>
			</div>

			<Separator />

			{/* 期間セクション */}
			<Card>
				<CardHeader>
					<CardTitle>{t("experience.detail.period")}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-base">
						{formatPeriod(item.period.from, item.period.to)}
					</p>
				</CardContent>
			</Card>

			{/* 雇用形態セクション */}
			{item.employmentType && (
				<Card>
					<CardHeader>
						<CardTitle>{t("experience.detail.employmentType")}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-base">{item.employmentType}</p>
					</CardContent>
				</Card>
			)}

			{/* 役職セクション */}
			{item.role && item.role.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>{t("experience.detail.role")}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{item.role.map((r, index) => (
								<span key={r} className="text-base">
									{r}
									{index < (item.role?.length ?? 0) - 1 && (
										<span className="text-muted-foreground mx-1">/</span>
									)}
								</span>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* 技術スタックセクション */}
			{item.techStack && item.techStack.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>{t("experience.detail.techStack")}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{item.techStack.map((tech: SimpleIcon) => (
								<BadgeWithIcon key={tech.slug} icon={tech} text={tech.title} />
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* 職種・業務内容セクション */}
			<Card>
				<CardHeader>
					<CardTitle>{t("experience.detail.description")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{item.description.map((desc, index) => (
							<div key={desc.title} className="space-y-3">
								{/* タイトル */}
								<h3 className="text-lg font-semibold">{desc.title}</h3>

								{/* 業務内容 */}
								<div className="space-y-2">
									<h4 className="text-base font-semibold">
										{t("experience.detail.content")}
									</h4>
									<MarkdownPreview
										content={desc.content}
										language={locale}
										className="prose-sm"
										remarkPlugins={[remarkGfm, remarkBreaks]}
									/>
								</div>

								{/* 技術スタック */}
								{desc.techStack && desc.techStack.length > 0 && (
									<div className="space-y-2">
										<h4 className="text-base font-semibold">
											{t("experience.detail.techStack")}
										</h4>
										<div className="flex flex-wrap gap-2">
											{desc.techStack.map((techName) => {
												const icon = getTechIcon(techName);
												return (
													<BadgeWithIcon
														key={techName}
														icon={icon}
														text={techName}
													/>
												);
											})}
										</div>
									</div>
								)}

								{/* その他 */}
								{desc.other && (
									<div className="space-y-2">
										<h4 className="text-base font-semibold">
											{t("experience.detail.other")}
										</h4>
										<MarkdownPreview
											content={desc.other}
											language={locale}
											className="prose-sm"
											remarkPlugins={[remarkGfm, remarkBreaks]}
										/>
									</div>
								)}

								{/* 最後の項目以外は区切り線を表示 */}
								{index < item.description.length - 1 && (
									<Separator className="my-4" />
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
