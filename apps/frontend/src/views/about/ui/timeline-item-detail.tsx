"use client";

import type { Locale } from "@saneatsu/i18n";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { SimpleIcon } from "simple-icons";

import { getTechMeta } from "@/shared/lib";
import type { TimelineItem } from "@/shared/types";
import { BadgeWithIcon, MarkdownPreview } from "@/shared/ui";

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
		<div className="space-y-8">
			{/* 会社名セクション */}
			<div>
				<h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 border-b-4 border-double border-border pb-2">
					{item.logoUrls && item.logoUrls.length > 0 && (
						<div className="flex items-center gap-2">
							{item.logoUrls.map((logoUrl, index) => (
								<Image
									key={logoUrl}
									src={logoUrl}
									alt={`${item.companyName} logo ${index + 1}`}
									width={32}
									height={32}
									className="object-contain shrink-0"
								/>
							))}
						</div>
					)}
					<span>{item.companyName}</span>
				</h2>
			</div>

			{/*
			 * 基本情報（期間・雇用形態・役職・技術スタック）
			 *
			 * これらは「項目名: 値」という対応関係を持つメタ情報なので、
			 * 定義リスト(dl/dt/dd)で表現し、ラベルと値の対応をアクセシビリティ上も明示する。
			 * 見出し(dt)は業務詳細セクションの見出しと同じ text-lg font-bold ＋ 実線の下線
			 * (border-b)にして、トップレベルのセクション見出しとして同じ扱いに揃えている。
			 */}
			<dl className="space-y-5">
				{/* 期間 */}
				<div>
					<dt className="text-lg font-bold border-b border-border pb-1">
						{t("experience.detail.period")}
					</dt>
					<dd className="mt-2 text-base">
						{formatPeriod(item.period.from, item.period.to)}
					</dd>
				</div>

				{/* 雇用形態 */}
				{item.employmentType && (
					<div>
						<dt className="text-lg font-bold border-b border-border pb-1">
							{t("experience.detail.employmentType")}
						</dt>
						<dd className="mt-2 text-base">{item.employmentType}</dd>
					</div>
				)}

				{/* 役職 */}
				{item.role && item.role.length > 0 && (
					<div>
						<dt className="text-lg font-bold border-b border-border pb-1">
							{t("experience.detail.role")}
						</dt>
						<dd className="mt-2 flex flex-wrap gap-2">
							{item.role.map((r, index) => (
								<span key={r} className="text-base">
									{r}
									{index < (item.role?.length ?? 0) - 1 && (
										<span className="text-muted-foreground mx-1">/</span>
									)}
								</span>
							))}
						</dd>
					</div>
				)}

				{/* 技術スタック */}
				{item.techStack && item.techStack.length > 0 && (
					<div>
						<dt className="text-lg font-bold border-b border-border pb-1">
							{t("experience.detail.techStack")}
						</dt>
						<dd className="mt-2 flex flex-wrap gap-2">
							{item.techStack.map((tech: SimpleIcon) => (
								<BadgeWithIcon key={tech.slug} icon={tech} text={tech.title} />
							))}
						</dd>
					</div>
				)}
			</dl>

			{/*
			 * 業務詳細セクション
			 *
			 * 役職の直下に各ブロック(desc)が見出し無しで並ぶと、それらが何なのか
			 * （役割フェーズなのか案件なのか）が伝わらないため、「業務詳細」という
			 * 大きめのセクション見出しで束ねる。
			 *
			 * 各ブロックのタイトル(desc.title)は「フリーランス」「アドバイザー」や
			 * 「2023-09: ○○の開発」など会社によって性質が異なるが、いずれも
			 * 「業務詳細」の中身として並ぶことで意味が明確になる。
			 *
			 * 見出し階層は 会社名(h2) > 業務詳細(h3) > ブロックタイトル(h4) >
			 * 小見出し(h5) と一段ずつ下げ、大小が素直に下る構造にしている。
			 */}
			<div className="space-y-6">
				<h3 className="text-lg font-bold border-b border-border pb-1">
					{t("experience.detail.description")}
				</h3>

				<div className="space-y-8">
					{item.description.map((desc) => (
						<div key={desc.title} className="space-y-3">
							{/* 案件・役割のタイトル */}
							<h4 className="text-base font-bold">{desc.title}</h4>

							{/* 業務内容 */}
							<div className="space-y-2">
								{/* 経営統合についての項目では見出しを表示しない */}
								{/* Mobile Order Lab・tacoms向けの特殊な処理 */}
								{desc.title !== "経営統合について" &&
									desc.title !== "About the Business Integration" && (
										<h5 className="text-sm font-semibold text-muted-foreground">
											{t("experience.detail.content")}
										</h5>
									)}
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
									<h5 className="text-sm font-semibold text-muted-foreground">
										{t("experience.detail.techStack")}
									</h5>
									<div className="flex flex-wrap gap-2">
										{desc.techStack.map((techName) => {
											// SSOTからメタ情報を取得し、simple-iconsに無い技術（AWS・Playwright等）も
											// renderIcon / backgroundColor を渡すことで正しくアイコン表示する
											const meta = getTechMeta(techName);
											return (
												<BadgeWithIcon
													key={techName}
													icon={meta?.icon}
													renderIcon={meta?.renderIcon}
													backgroundColor={meta?.backgroundColor}
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
									<h5 className="text-sm font-semibold text-muted-foreground">
										{t("experience.detail.other")}
									</h5>
									<MarkdownPreview
										content={desc.other}
										language={locale}
										className="prose-sm"
										remarkPlugins={[remarkGfm, remarkBreaks]}
									/>
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
