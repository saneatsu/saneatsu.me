"use client";

import { ExternalLink } from "lucide-react";

import { useOgp } from "../../api/use-ogp/use-ogp";

/**
 * URLカードのプロパティ
 */
interface UrlCardProps {
	/** 表示するURL */
	url: string;
}

/**
 * URLカードコンポーネント
 *
 * @description
 * OGP情報を取得してZennスタイルのカード形式で表示する
 *
 * 表示状態：
 * - ローディング: スケルトン表示
 * - 成功（OGP情報あり）: タイトル、説明、画像、ファビコンを表示
 * - 成功（OGP情報なし）: ドメインとパスのみの簡易カード
 * - エラー: 簡易カード（ドメイン+パス）
 *
 * @example
 * ```tsx
 * <UrlCard url="https://feature-sliced.github.io/" />
 * ```
 */
export function UrlCard({ url }: UrlCardProps) {
	const { data, isLoading, isError } = useOgp(url);

	// ドメイン名を取得
	const getDomain = (urlString: string): string => {
		try {
			const urlObj = new URL(urlString);
			return urlObj.hostname;
		} catch {
			return urlString;
		}
	};

	// ローディング状態
	if (isLoading) {
		return (
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className="block not-prose my-4"
			>
				<div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow animate-pulse">
					<div className="flex">
						{/* スケルトン画像 */}
						<div className="aspect-video w-48 bg-gray-200 dark:bg-gray-700 shrink-0" />
						{/* スケルトンコンテンツ */}
						<div className="flex-1 p-4 space-y-2">
							<div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
							<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
							<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
							<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-auto" />
						</div>
					</div>
				</div>
			</a>
		);
	}

	// エラーまたはOGP情報なし：簡易カード
	if (isError || !data || (!data.title && !data.image)) {
		return (
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className="block not-prose my-4"
			>
				<div className="border rounded-lg p-4 hover:shadow-md transition-shadow flex items-center gap-3">
					<ExternalLink className="w-5 h-5 text-muted-foreground shrink-0" />
					<div className="flex-1 min-w-0">
						<div className="font-medium text-sm truncate">{getDomain(url)}</div>
						<div className="text-xs text-muted-foreground truncate">{url}</div>
					</div>
				</div>
			</a>
		);
	}

	// OGP情報あり：フルカード
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="block not-prose my-4"
		>
			<div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
				<div className="flex">
					{/* OGP画像 */}
					{data.image && (
						<div className="aspect-video w-48 shrink-0 relative overflow-hidden bg-gray-100 dark:bg-gray-800">
							{/* biome-ignore lint/performance/noImgElement: OGP画像は外部URLなのでNext.js Imageは使用できない */}
							<img
								src={data.image}
								alt={data.title || ""}
								className="w-full h-full object-cover"
							/>
						</div>
					)}
					{/* コンテンツ */}
					<div className="flex-1 p-4 min-w-0 flex flex-col">
						{/* タイトル */}
						{data.title && (
							<div className="font-medium text-sm line-clamp-2 mb-1">
								{data.title}
							</div>
						)}
						{/* 説明 */}
						{data.description && (
							<div className="text-xs text-muted-foreground line-clamp-2 mb-2">
								{data.description}
							</div>
						)}
						{/* ドメイン情報 */}
						<div className="flex items-center gap-2 mt-auto">
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
							<div className="text-xs text-muted-foreground truncate">
								{data.siteName || getDomain(url)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</a>
	);
}
