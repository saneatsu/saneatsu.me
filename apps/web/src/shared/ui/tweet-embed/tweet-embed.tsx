"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import { Skeleton } from "../skeleton/skeleton";

/**
 * TweetEmbedコンポーネントのプロパティ
 */
export interface TweetEmbedProps {
	/** ツイートID（URLから抽出された数値ID） */
	id: string;
	/** 追加のCSSクラス */
	className?: string;
}

/**
 * Twitter Syndication APIのレスポンス型
 */
interface TwitterSyndicationResponse {
	/** メディア詳細（画像・動画など） */
	mediaDetails?: Array<{
		/** メディアタイプ */
		type: "photo" | "video" | "animated_gif";
		/** メディアURL */
		media_url_https?: string;
		/** 動画情報 */
		video_info?: unknown;
	}>;
	/** その他のフィールド */
	[key: string]: unknown;
}

/**
 * Twitter Syndication APIでツイートのメタデータを取得
 *
 * @description
 * CORS問題を回避するため、自前のAPI Routeを経由してメタデータを取得する。
 * 画像の有無などのメタデータを取得して、適切なSkeletonサイズを判定する。
 *
 * @param id - ツイートID
 * @returns メタデータ（失敗時はnull）
 */
async function fetchTweetMetadata(
	id: string,
): Promise<TwitterSyndicationResponse | null> {
	try {
		// 自前のAPI Routeを経由（CORS問題を回避）
		const response = await fetch(`/api/tweet-metadata?id=${id}`);

		if (!response.ok) {
			console.warn(`Failed to fetch tweet metadata: ${response.status}`);
			return null;
		}

		return await response.json();
	} catch (error) {
		console.warn("Error fetching tweet metadata:", error);
		return null;
	}
}

/**
 * ローディング状態の型定義
 */
type LoadingState = "fetching-metadata" | "loading-tweet" | "loaded";

/**
 * ツイート埋め込みコンポーネント
 *
 * @description
 * X(Twitter)のツイートを埋め込み表示するコンポーネント。
 * Twitter公式のwidgets.jsを使用して実装。
 *
 * @features
 * 1. ライト/ダークテーマ対応
 * 2. 動的なSkeletonサイズ選択（CLS最適化）
 * 3. レスポンシブデザイン
 * 4. 公式デザインのまま表示（iframe形式）
 *
 * @implementation
 * 1. Twitter Syndication APIでメタデータ取得（画像有無を判定）
 * 2. 画像有無に応じて適切なSkeletonを表示
 * 3. widgets.jsをロード（初回のみ）
 * 4. blockquoteタグを動的に生成（id/theme変更時に再生成）
 * 5. twttr.widgets.load()で埋め込み実行
 *
 * @example
 * ```tsx
 * <TweetEmbed id="1234567890123456789" />
 * ```
 */
export function TweetEmbed({ id, className }: TweetEmbedProps) {
	const { theme } = useTheme();
	const containerRef = useRef<HTMLDivElement>(null);
	const [loadingState, setLoadingState] =
		useState<LoadingState>("fetching-metadata");
	const [hasMedia, setHasMedia] = useState(false);

	// Phase 1: メタデータを取得して画像の有無を判定
	useEffect(() => {
		const fetchMetadata = async () => {
			setLoadingState("fetching-metadata");

			const metadata = await fetchTweetMetadata(id);

			// 画像・動画の有無を判定
			const mediaExists =
				metadata?.mediaDetails && metadata.mediaDetails.length > 0;
			setHasMedia(mediaExists ?? false);

			// メタデータ取得完了、次の段階へ
			setLoadingState("loading-tweet");
		};

		fetchMetadata();
	}, [id]);

	// Phase 2: widgets.jsで埋め込み実行
	useEffect(() => {
		if (loadingState !== "loading-tweet") return;

		const container = containerRef.current;
		if (!container) return;

		// 既存のコンテンツをクリア（id/themeが変わったときのため）
		container.innerHTML = "";

		// blockquoteを動的に生成（id と theme を使用）
		const blockquote = document.createElement("blockquote");
		blockquote.className = "twitter-tweet";
		blockquote.setAttribute("data-theme", theme === "dark" ? "dark" : "light");

		const link = document.createElement("a");
		link.href = `https://twitter.com/i/status/${id}`;
		link.textContent = "View tweet";

		blockquote.appendChild(link);
		container.appendChild(blockquote);

		// widgets.jsをロードして埋め込み実行
		if (!window.twttr) {
			const script = document.createElement("script");
			script.src = "https://platform.twitter.com/widgets.js";
			script.async = true;
			script.onload = () => {
				if (window.twttr?.widgets) {
					window.twttr.widgets.load(container).then(() => {
						setLoadingState("loaded");
					});
				}
			};
			document.body.appendChild(script);
		} else {
			if (window.twttr?.widgets) {
				window.twttr.widgets.load(container).then(() => {
					setLoadingState("loaded");
				});
			}
		}
	}, [loadingState, id, theme]);

	return (
		<div className={className}>
			{/* メタデータ取得中は小さいSkeletonを表示 */}
			{loadingState === "fetching-metadata" && <TweetSkeletonSmall />}

			{/* widgets.js読み込み中は判定結果に応じたSkeletonを表示 */}
			{loadingState === "loading-tweet" &&
				(hasMedia ? <TweetSkeletonLarge /> : <TweetSkeletonSmall />)}

			{/* 埋め込み完了後はコンテナを表示 */}
			<div
				ref={containerRef}
				style={{ display: loadingState === "loaded" ? "block" : "none" }}
			/>
		</div>
	);
}

/**
 * ツイート読み込み中のスケルトン表示（画像なし用）
 *
 * @description
 * 画像を含まないテキストのみのツイート用のスケルトン。
 * 小さめのサイズでLayout Shiftを最小限に抑える。
 */
function TweetSkeletonSmall() {
	return (
		<div className="flex justify-center my-6">
			<div
				className="w-full max-w-[550px] border rounded-xl p-4 space-y-3"
				style={{ minHeight: "200px" }}
			>
				{/* ヘッダー部分 */}
				<div className="flex items-center space-x-2">
					<Skeleton className="h-12 w-12 rounded-full shrink-0" />
					<div className="space-y-2 flex-1">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>

				{/* テキスト部分（短め） */}
				<div className="space-y-2 pt-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</div>

				{/* タイムスタンプ */}
				<div className="pt-2">
					<Skeleton className="h-3 w-32" />
				</div>

				{/* フッター部分（いいね・リツイート・返信数など） */}
				<div className="flex justify-around pt-2 border-t">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-16" />
				</div>
			</div>
		</div>
	);
}

/**
 * ツイート読み込み中のスケルトン表示（画像あり用）
 *
 * @description
 * 画像を含むツイート用のスケルトン。
 * 大きめのサイズでLayout Shiftを最小限に抑える。
 */
function TweetSkeletonLarge() {
	return (
		<div className="flex justify-center my-6">
			<div
				className="w-full max-w-[550px] border rounded-xl p-4 space-y-3"
				style={{ minHeight: "600px" }}
			>
				{/* ヘッダー部分 */}
				<div className="flex items-center space-x-2">
					<Skeleton className="h-12 w-12 rounded-full shrink-0" />
					<div className="space-y-2 flex-1">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>

				{/* テキスト部分（長め） */}
				<div className="space-y-2 pt-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-11/12" />
					<Skeleton className="h-4 w-10/12" />
					<Skeleton className="h-4 w-3/4" />
				</div>

				{/* 画像プレースホルダー */}
				<Skeleton className="h-[400px] w-full rounded-lg" />

				{/* タイムスタンプ */}
				<div className="pt-2">
					<Skeleton className="h-3 w-32" />
				</div>

				{/* フッター部分（いいね・リツイート・返信数など） */}
				<div className="flex justify-around pt-2 border-t">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-16" />
				</div>
			</div>
		</div>
	);
}
