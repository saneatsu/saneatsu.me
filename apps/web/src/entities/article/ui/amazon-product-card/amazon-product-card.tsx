"use client";

import { ExternalLink } from "lucide-react";

import { AmazonLogo } from "@/shared/image";

import { useOgp } from "../../api/use-ogp/use-ogp";

/**
 * Amazon商品カードのプロパティ
 */
export interface AmazonProductCardProps {
	/** 商品URL */
	url: string;
	/** ASIN（Amazon Standard Identification Number）
	 * 短縮URL（amzn.to）の場合は取得できないためオプショナル
	 */
	asin?: string;
	/** Amazonドメイン（例: amazon.co.jp） */
	domain?: string;
}

/**
 * Amazon商品カードコンポーネント
 *
 * @description
 * Amazon商品のOGP情報を取得してカード形式で表示する。
 *
 * 表示状態：
 * - ローディング: スケルトン表示
 * - 成功（OGP情報あり）: 商品画像、タイトル、説明、「Amazonで見る」ボタン
 * - 成功（OGP情報なし）: 簡易カード（ASIN表示）
 * - エラー: 簡易カード（ASIN表示）
 *
 * @example
 * ```tsx
 * <AmazonProductCard
 *   url="https://www.amazon.co.jp/dp/B08N5WRWNW"
 *   asin="B08N5WRWNW"
 *   domain="amazon.co.jp"
 * />
 * ```
 */
export function AmazonProductCard({
	url,
	asin,
	domain = "amazon.co.jp",
}: AmazonProductCardProps) {
	const { data, isLoading, isError } = useOgp(url);

	// ドメイン名を整形
	const formattedDomain = domain.replace("www.", "");

	// ローディング状態
	if (isLoading) {
		return (
			<div className="block not-prose my-4">
				<div className="border border-[#FF9900]/20 rounded-lg overflow-hidden hover:shadow-md transition-shadow animate-pulse bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-orange-950/20">
					<div className="flex flex-col sm:flex-row">
						{/* スケルトン画像 */}
						<div className="aspect-square w-40 sm:w-48 mx-auto sm:mx-0 bg-gray-200 dark:bg-gray-700 shrink-0" />
						{/* スケルトンコンテンツ */}
						<div className="flex-1 p-4 space-y-3">
							<div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
							<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
							<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
							<div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 mt-auto" />
						</div>
					</div>
				</div>
			</div>
		);
	}

	// エラーまたはOGP情報なし：簡易カード
	if (isError || !data || (!data.title && !data.image)) {
		return (
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer sponsored"
				className="block not-prose my-4 cursor-pointer"
			>
				<div className="border border-[#FF9900]/20 rounded-lg p-4 hover:shadow-md transition-shadow flex items-center gap-3 bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-orange-950/20">
					<AmazonLogo className="w-5 h-5 text-[#FF9900] shrink-0" />
					<div className="flex-1 min-w-0">
						<div className="font-medium text-sm">
							{asin ? `Amazon商品 (ASIN: ${asin})` : "Amazon商品（短縮URL）"}
						</div>
						<div className="text-xs text-muted-foreground truncate">
							{formattedDomain}
						</div>
					</div>
					<ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
				</div>
			</a>
		);
	}

	// OGP情報あり：フルカード
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer sponsored"
			className="block not-prose my-4 group cursor-pointer"
		>
			<div className="border border-[#FF9900]/20 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-orange-950/20">
				<div className="flex flex-col sm:flex-row">
					{/* 商品画像 */}
					{data.image && (
						<div className="aspect-square w-40 sm:w-48 mx-auto sm:mx-0 shrink-0 relative overflow-hidden bg-white dark:bg-gray-800">
							{/* biome-ignore lint/performance/noImgElement: OGP画像は外部URLなのでNext.js Imageは使用できない */}
							<img
								src={data.image}
								alt={data.title || "Amazon商品"}
								className="w-full h-full object-contain p-4"
							/>
						</div>
					)}
					{/* コンテンツ */}
					<div className="flex-1 p-4 min-w-0 flex flex-col gap-3">
						{/* タイトル */}
						{data.title && (
							<h3 className="font-semibold text-base line-clamp-2 group-hover:underline">
								{data.title}
							</h3>
						)}
						{/* 説明 */}
						{data.description && (
							<p className="hidden sm:block text-sm text-muted-foreground line-clamp-2">
								{data.description}
							</p>
						)}
						{/* ボタンとドメイン情報 */}
						<div className="flex items-center justify-between gap-3 mt-auto">
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								{data.favicon && (
									// biome-ignore lint/performance/noImgElement: ファビコンは外部URLなのでNext.js Imageは使用できない
									<img
										src={data.favicon}
										alt=""
										className="w-4 h-4"
										onError={(e) => {
											// ファビコン読み込み失敗時は非表示
											e.currentTarget.style.display = "none";
										}}
									/>
								)}
								<span className="truncate">{formattedDomain}</span>
							</div>
							<div className="bg-[#FF9900] hover:bg-[#FF9900]/90 text-white px-3 py-1.5 rounded-md text-sm font-medium shrink-0 flex items-center gap-1.5 pointer-events-none">
								<AmazonLogo className="w-4 h-4" />
								Amazonで見る
							</div>
						</div>
					</div>
				</div>
			</div>
		</a>
	);
}
