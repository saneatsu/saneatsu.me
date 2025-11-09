"use client";

import { ExternalLink } from "lucide-react";

import { AmazonLogo, RakutenLogo } from "@/shared/image";
import { Button } from "@/shared/ui";

import { useOgp } from "../../api/use-ogp/use-ogp";

/**
 * 統合商品カードのプロパティ
 */
export interface ProductCardProps {
	/** Amazon商品URL（オプショナル） */
	amazonUrl?: string;
	/** ASIN（Amazon Standard Identification Number）
	 * 短縮URL（amzn.to）の場合は取得できないためオプショナル
	 */
	amazonAsin?: string;
	/** Amazonドメイン（例: amazon.co.jp） */
	amazonDomain?: string;
	/** 楽天商品URL（オプショナル） */
	rakutenUrl?: string;
	/** 楽天ドメイン（例: a.r10.to） */
	rakutenDomain?: string;
}

/**
 * 統合商品カードコンポーネント
 *
 * @description
 * AmazonとRakutenの商品情報を統合して表示するカード。
 * OGP情報を取得してカード形式で表示する。
 *
 * 表示状態：
 * - ローディング: スケルトン表示
 * - 成功（OGP情報あり）: 商品画像、タイトル、説明、プラットフォームボタン（Amazon/Rakuten）
 * - 成功（OGP情報なし）: 簡易カード（ASIN/URL表示）
 * - エラー: 簡易カード（ASIN/URL表示）
 *
 * 動作：
 * 1. カード全体のクリックでAmazonに遷移（Amazon URLがある場合）
 * 2. ボタンエリアにAmazonボタンと楽天ボタンを表示（存在するURLのみ）
 * 3. OGP取得はAmazon優先（なければ楽天URL）
 *
 * @example
 * ```tsx
 * <ProductCard
 *   amazonUrl="https://www.amazon.co.jp/dp/B08N5WRWNW"
 *   amazonAsin="B08N5WRWNW"
 *   amazonDomain="amazon.co.jp"
 *   rakutenUrl="https://a.r10.to/hF6JlM"
 *   rakutenDomain="a.r10.to"
 * />
 * ```
 */
export function ProductCard({
	amazonUrl,
	amazonAsin,
	amazonDomain = "amazon.co.jp",
	rakutenUrl,
	rakutenDomain = "rakuten.co.jp",
}: ProductCardProps) {
	// OGP取得はAmazon優先、なければ楽天URL
	const ogpUrl = amazonUrl || rakutenUrl || "";
	const { data, isLoading, isError } = useOgp(ogpUrl);

	// カード全体のクリックURL（Amazon優先）
	const cardUrl = amazonUrl || rakutenUrl || "";

	// ドメイン名を整形
	const formattedAmazonDomain = amazonDomain.replace("www.", "");
	const formattedRakutenDomain = rakutenDomain.replace("www.", "");

	/**
	 * ボタンクリックハンドラー（イベント伝播を停止）
	 *
	 * @description
	 * カード全体のクリックイベントとボタンのクリックイベントが
	 * 競合しないように、ボタンクリック時はイベント伝播を停止する。
	 */
	const handleButtonClick = (
		e: React.MouseEvent<HTMLButtonElement>,
		url: string
	) => {
		e.preventDefault();
		e.stopPropagation();
		window.open(url, "_blank", "noopener,noreferrer");
	};

	// ローディング状態
	if (isLoading) {
		return (
			<div className="block not-prose my-4">
				<div className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow animate-pulse bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950/20">
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
				href={cardUrl}
				target="_blank"
				rel="noopener noreferrer sponsored"
				className="block not-prose my-4 cursor-pointer"
			>
				<div className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow flex items-center gap-3 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950/20">
					<div className="flex gap-2 shrink-0">
						{amazonUrl && <AmazonLogo className="w-5 h-5 text-brand-amazon" />}
						{rakutenUrl && (
							<RakutenLogo className="w-5 h-5 text-brand-rakuten" />
						)}
					</div>
					<div className="flex-1 min-w-0">
						<div className="font-medium text-sm">
							{amazonUrl && amazonAsin
								? `Amazon商品 (ASIN: ${amazonAsin})`
								: amazonUrl
									? "Amazon商品（短縮URL）"
									: "楽天商品"}
						</div>
						<div className="text-xs text-muted-foreground truncate">
							{amazonUrl && formattedAmazonDomain}
							{amazonUrl && rakutenUrl && " / "}
							{rakutenUrl && formattedRakutenDomain}
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
			href={cardUrl}
			target="_blank"
			rel="noopener noreferrer sponsored"
			className="block not-prose my-4 group cursor-pointer"
		>
			<div className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950/20">
				<div className="flex flex-col sm:flex-row">
					{/* 商品画像 */}
					{data.image && (
						<div className="aspect-square w-40 sm:w-48 mx-auto sm:mx-0 shrink-0 relative overflow-hidden bg-white dark:bg-gray-800">
							{/* biome-ignore lint/performance/noImgElement: OGP画像は外部URLなのでNext.js Imageは使用できない */}
							<img
								src={data.image}
								alt={data.title || "商品画像"}
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
								<span className="truncate">
									{amazonUrl && formattedAmazonDomain}
									{amazonUrl && rakutenUrl && " / "}
									{rakutenUrl && formattedRakutenDomain}
								</span>
							</div>
							{/* プラットフォームボタン */}
							<div className="flex items-center gap-2 shrink-0">
								{amazonUrl && (
									<Button
										variant="default"
										size="sm"
										className="bg-brand-amazon hover:bg-brand-amazon/90 text-white px-3 py-1.5 h-auto"
										onClick={(e) => handleButtonClick(e, amazonUrl)}
									>
										<AmazonLogo className="w-4 h-4 mr-1" />
										Amazon
									</Button>
								)}
								{rakutenUrl && (
									<Button
										variant="default"
										size="sm"
										className="bg-brand-rakuten hover:bg-brand-rakuten/90 text-white px-3 py-1.5 h-auto"
										onClick={(e) => handleButtonClick(e, rakutenUrl)}
									>
										<RakutenLogo className="w-4 h-4 mr-1" />
										楽天
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</a>
	);
}
