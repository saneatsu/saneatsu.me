"use client";

import type { ContributionDay, ContributionSummary } from "@saneatsu/schemas";
import { useMemo, useState } from "react";

import { cn } from "@/shared/lib";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Skeleton,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui";

type LegendClassList = readonly [string, string, string, string, string];

const COLOR_CLASSES: Record<Metric, LegendClassList> = {
	updates: [
		"bg-muted text-muted-foreground",
		"bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
		"bg-emerald-200 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100",
		"bg-emerald-400 text-white dark:bg-emerald-700",
		"bg-emerald-600 text-white dark:bg-emerald-500",
	],
	jaChars: [
		"bg-muted text-muted-foreground",
		"bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
		"bg-sky-200 text-sky-900 dark:bg-sky-900/70 dark:text-sky-100",
		"bg-sky-400 text-white dark:bg-sky-700",
		"bg-sky-600 text-white dark:bg-sky-500",
	],
} as const satisfies Record<Metric, LegendClassList>;

type Metric = "updates" | "jaChars";

export type ContributionCopy = {
	title: string;
	subtitle?: string;
	rangeLabel: (days: number) => string;
	toggleUpdates: string;
	toggleJaChars: string;
	summaryTotalUpdates: string;
	summaryTotalJaChars: string;
	summaryCurrentStreak: string;
	legendLabel: string;
	legendLess: string;
	legendMore: string;
	empty: string;
	error: string;
	retry: string;
	lastUpdatedPrefix: string;
	metricUpdatesUnit: string;
	metricJaCharsUnit: string;
};

type ContributionActivityCardProps = {
	summary?: ContributionSummary;
	isLoading?: boolean;
	error?: Error | null;
	onRetry?: () => void;
	copy: ContributionCopy;
	locale?: string;
	rangeDays?: number;
};

/** 指定したロケールで数値をフォーマットする */
const formatNumber = (value: number, locale: string) =>
	new Intl.NumberFormat(locale).format(value);

/** ツールチップ用に日付をフォーマットする */
const formatDateLabel = (dateString: string, locale: string) =>
	new Date(`${dateString}T00:00:00`).toLocaleDateString(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

/**
 * 執筆データを最大7件ずつの列に並べ替える。
 */
type WeekCell = {
	key: string;
	day: ContributionDay;
};

const buildWeeks = (days: ContributionDay[]) => {
	const weeks: WeekCell[][] = [];
	let currentWeek: WeekCell[] = [];

	for (const day of days) {
		currentWeek.push({ key: day.date, day });
		if (currentWeek.length === 7) {
			weeks.push(currentWeek);
			currentWeek = [];
		}
	}

	if (currentWeek.length > 0) {
		weeks.push(currentWeek);
	}

	return weeks;
};

/** カラースケール用の濃淡インデックスを算出する（0-4） */
const getIntensity = (value: number, max: number) => {
	if (!value || !max) return 0;
	const step = max / 4;
	if (value <= step) return 1;
	if (value <= step * 2) return 2;
	if (value <= step * 3) return 3;
	return 4;
};

/** 直近から連続している執筆日数を逆順に数える */
const calculateCurrentStreak = (days: ContributionDay[]) => {
	let streak = 0;
	for (let i = days.length - 1; i >= 0; i -= 1) {
		const day = days[i];
		if (day.updates > 0 || day.jaChars > 0) {
			streak += 1;
		} else {
			break;
		}
	}
	return streak;
};

/**
 * ダッシュボードや公開ページで再利用する執筆ヒートマップカード。
 *
 * @param props.summary 執筆データ概要
 * @param props.isLoading ローディング状態
 * @param props.error エラー内容
 * @param props.onRetry リトライハンドラ
 * @param props.copy 表示文言セット
 * @param props.locale 数値と日付のロケール
 * @param props.rangeDays 表示する期間（日数）
 */
export function ContributionActivityCard({
	summary,
	isLoading,
	error,
	onRetry,
	copy,
	locale = "ja-JP",
	rangeDays,
}: ContributionActivityCardProps) {
	const [metric, setMetric] = useState<Metric>("updates");
	const dayCount = summary?.days.length ?? 0;
	const isSupportedRange = dayCount === 365 || dayCount === 366;
	const normalizedDays = useMemo(() => {
		if (!summary || !isSupportedRange) return [];
		return summary.days;
	}, [summary, isSupportedRange]);
	// 少なくとも1日データがあれば可視化を表示
	const hasData =
		normalizedDays.some((day) => day.updates > 0 || day.jaChars > 0) ?? false;
	const computedRange = rangeDays ?? summary?.days.length ?? 365;
	const streak = summary ? calculateCurrentStreak(summary.days) : 0;
	// 一度だけ週配列を計算し、再レンダーを抑制
	const weeks = useMemo(() => {
		if (normalizedDays.length === 0) return [];
		return buildWeeks(normalizedDays);
	}, [normalizedDays]);

	const maxValue =
		metric === "updates"
			? (summary?.maxUpdates ?? 0)
			: (summary?.maxJaChars ?? 0);

	/** 凡例エリアを描画する */
	const renderLegend = () => (
		<div className="flex flex-col gap-1 text-xs text-muted-foreground">
			<div className="flex items-center gap-2">
				<div className="flex items-center gap-1">
					{COLOR_CLASSES[metric].map((cls) => (
						<div
							key={`${metric}-${cls}`}
							className={cn("size-3 rounded-sm border border-border/50", cls)}
						/>
					))}
				</div>
				<span className="ml-auto">{copy.legendLabel}</span>
			</div>
			<div className="flex items-center justify-between">
				<span>{copy.legendLess}</span>
				<span>{copy.legendMore}</span>
			</div>
		</div>
	);

	/** 総更新数などのサマリーを描画する */
	const renderSummary = () => (
		<div className="grid gap-4 sm:grid-cols-3">
			<div>
				<p className="text-sm text-muted-foreground">
					{copy.summaryTotalUpdates}
				</p>
				{isLoading ? (
					<Skeleton className="h-6 w-16" />
				) : (
					<p className="text-2xl font-semibold">
						{formatNumber(summary?.totalUpdates ?? 0, locale)}
					</p>
				)}
			</div>
			<div>
				<p className="text-sm text-muted-foreground">
					{copy.summaryTotalJaChars}
				</p>
				{isLoading ? (
					<Skeleton className="h-6 w-16" />
				) : (
					<p className="text-2xl font-semibold">
						{formatNumber(summary?.totalJaChars ?? 0, locale)}
					</p>
				)}
			</div>
			<div>
				<p className="text-sm text-muted-foreground">
					{copy.summaryCurrentStreak}
				</p>
				{isLoading ? (
					<Skeleton className="h-6 w-16" />
				) : (
					<p className="text-2xl font-semibold">
						{formatNumber(streak, locale)}
					</p>
				)}
			</div>
		</div>
	);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<div>
						<CardTitle>{copy.title}</CardTitle>
						{copy.subtitle && (
							<CardDescription>{copy.subtitle}</CardDescription>
						)}
					</div>
					<div className="text-sm text-muted-foreground text-right">
						{copy.rangeLabel(computedRange)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{error ? (
					<div className="space-y-3">
						<p className="text-sm text-destructive">{copy.error}</p>
						{onRetry && (
							<Button onClick={onRetry} variant="outline">
								{copy.retry}
							</Button>
						)}
					</div>
				) : (
					<>
						<div className="flex flex-wrap items-center justify-between gap-3">
							{renderSummary()}
							<div className="flex items-center gap-2">
								<Button
									variant={metric === "updates" ? "default" : "outline"}
									onClick={() => setMetric("updates")}
									aria-pressed={metric === "updates"}
								>
									{copy.toggleUpdates}
								</Button>
								<Button
									variant={metric === "jaChars" ? "default" : "outline"}
									onClick={() => setMetric("jaChars")}
									aria-pressed={metric === "jaChars"}
								>
									{copy.toggleJaChars}
								</Button>
							</div>
						</div>

						<div className="space-y-3">
							{!summary || isLoading ? (
								<div className="space-y-2">
									<Skeleton className="h-24 w-full" />
									<Skeleton className="h-4 w-1/2" />
								</div>
							) : hasData && isSupportedRange ? (
								<div className="overflow-x-auto">
									<div className="flex gap-1">
										{weeks.map((week, weekIndex) => {
											const weekKey =
												week[0]?.key ??
												`${summary?.startDate ?? "week"}-${weekIndex}`;
											return (
												<div key={weekKey} className="flex flex-col gap-1">
													{week.map(({ key, day }) => {
														const value =
															metric === "updates" ? day.updates : day.jaChars;
														const intensity = getIntensity(value, maxValue);
														const intensityIndex = Math.max(
															0,
															Math.min(
																intensity,
																COLOR_CLASSES[metric].length - 1
															)
														) as 0 | 1 | 2 | 3 | 4;
														const label = `${formatDateLabel(day.date, locale)} · ${day.updates} ${copy.metricUpdatesUnit} · ${day.jaChars} ${copy.metricJaCharsUnit}`;
														return (
															<Tooltip key={key}>
																<TooltipTrigger asChild>
																	<button
																		type="button"
																		className={cn(
																			"size-3 rounded-[2px] border border-border/40",
																			COLOR_CLASSES[metric][intensityIndex]
																		)}
																		aria-label={label}
																		aria-pressed={value > 0}
																		data-intensity={intensity}
																	/>
																</TooltipTrigger>
																<TooltipContent>{label}</TooltipContent>
															</Tooltip>
														);
													})}
												</div>
											);
										})}
									</div>
									{renderLegend()}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">{copy.empty}</p>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
