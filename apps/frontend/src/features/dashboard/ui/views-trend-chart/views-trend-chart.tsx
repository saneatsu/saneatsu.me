"use client";

import { Calendar, TrendingUp } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { useViewsTrend } from "@/features/dashboard";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card/card";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

/**
 * 閲覧数推移グラフコンポーネントのプロパティ
 */
interface ViewsTrendChartProps {
	/** 言語設定 */
	language?: "ja" | "en";
	/** 選択された日数 */
	selectedDays: 30 | 90 | 180 | 360;
	/** Cardを表示しないオプション */
	hideCard?: boolean;
}

/**
 * 閲覧数推移を表示するグラフコンポーネント
 * 30日、90日、180日、360日の期間で切り替え可能
 */
export function ViewsTrendChart({
	language = "ja",
	selectedDays,
	hideCard = false,
}: ViewsTrendChartProps) {
	const { theme } = useTheme();
	const { data, isLoading, error } = useViewsTrend({
		language,
		days: selectedDays,
	});

	// CSS変数から実際の色値を取得するstate
	const [primaryColor, setPrimaryColor] = useState<string>("#000000");

	/**
	 * テーマ変更時にprimaryカラーを取得
	 */
	useEffect(() => {
		if (typeof window === "undefined") return;

		const updatePrimaryColor = () => {
			const styles = getComputedStyle(document.documentElement);
			const primary = styles.getPropertyValue("--primary").trim();
			// CSS変数はすでにhsl()形式なのでそのまま使用
			setPrimaryColor(primary);
		};

		// 初回実行
		updatePrimaryColor();

		// テーマ変更を監視するために、MutationObserverを使用
		const observer = new MutationObserver(updatePrimaryColor);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, []);

	/**
	 * 日付フォーマット関数
	 */
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("ja-JP", {
			month: "short",
			day: "numeric",
		});
	};

	/**
	 * 数値フォーマット関数
	 */
	const formatNumber = (num: number) => {
		return new Intl.NumberFormat("ja-JP").format(num);
	};

	/**
	 * ダークモード対応のグラフカラー取得
	 */
	const getChartColors = () => {
		const isDark = theme === "dark";
		return {
			barFill: primaryColor, // 実際のprimaryカラーの値を使用
			axisStroke: isDark ? "#9ca3af" : "#6b7280", // ダークモード: gray-400, ライトモード: gray-500
			gridStroke: isDark ? "#374151" : "#e5e7eb", // ダークモード: gray-700, ライトモード: gray-200
		};
	};

	/**
	 * ローディング中のスケルトン表示
	 */
	const renderSkeleton = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-10 w-24" />
			</div>
			<Skeleton className="h-[300px] w-full" />
		</div>
	);

	/**
	 * エラー表示
	 */
	const renderError = () => (
		<div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
			<TrendingUp className="h-12 w-12 mb-4 opacity-50" />
			<p>データの読み込みに失敗しました</p>
			{error && (
				<p className="text-sm mt-2 text-destructive">
					{error instanceof Error ? error.message : "不明なエラー"}
				</p>
			)}
		</div>
	);

	/**
	 * データがない場合の表示
	 */
	const renderNoData = () => (
		<div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
			<Calendar className="h-12 w-12 mb-4 opacity-50" />
			<p>表示するデータがありません</p>
		</div>
	);

	/**
	 * カスタムツールチップ
	 */
	const CustomTooltip = ({
		active,
		payload,
		label,
	}: {
		active?: boolean;
		payload?: Array<{ value: number }>;
		label?: string;
	}) => {
		if (active && payload && payload.length && label) {
			return (
				<div className="bg-popover text-popover-foreground border rounded-lg shadow-lg p-3">
					<p className="text-sm font-medium">{formatDate(label)}</p>
					<p className="text-sm text-muted-foreground">
						閲覧数: {formatNumber(payload[0].value)}
					</p>
				</div>
			);
		}
		return null;
	};

	const content = (
		<>
			{isLoading ? (
				renderSkeleton()
			) : error ? (
				renderError()
			) : !data || data.data.length === 0 ? (
				renderNoData()
			) : (
				<div className="space-y-4">
					{/* 統計サマリー */}
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							期間: {formatDate(data.startDate)} - {formatDate(data.endDate)}
						</span>
						<span className="font-medium">
							総閲覧数: {formatNumber(data.totalViews)}
						</span>
					</div>

					{/* グラフ */}
					<div className="h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={data.data}
								margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke={getChartColors().gridStroke}
									vertical={false}
								/>
								<XAxis
									dataKey="date"
									tickFormatter={formatDate}
									stroke={getChartColors().axisStroke}
									fontSize={12}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									tickFormatter={formatNumber}
									stroke={getChartColors().axisStroke}
									fontSize={12}
									tickLine={false}
									axisLine={false}
								/>
								<Tooltip content={<CustomTooltip />} />
								<Bar
									dataKey="views"
									fill={getChartColors().barFill}
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			)}
		</>
	);

	if (hideCard) {
		return content;
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center space-x-2">
					<TrendingUp className="h-5 w-5 text-primary" />
					<div>
						<CardTitle>閲覧数推移</CardTitle>
						<CardDescription>期間別の閲覧数トレンド</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>{content}</CardContent>
		</Card>
	);
}
