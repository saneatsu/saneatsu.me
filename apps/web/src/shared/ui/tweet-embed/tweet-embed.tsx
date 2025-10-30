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
 * ツイート埋め込みコンポーネント
 *
 * @description
 * X(Twitter)のツイートを埋め込み表示するコンポーネント。
 * Twitter公式のwidgets.jsを使用して実装。
 *
 * @features
 * 1. ライト/ダークテーマ対応
 * 2. ロード中状態の表示
 * 3. レスポンシブデザイン
 * 4. 公式デザインのまま表示（iframe形式）
 *
 * @implementation
 * 1. widgets.jsをロード（初回のみ）
 * 2. blockquoteタグを動的に生成（id/theme変更時に再生成）
 * 3. twttr.widgets.load()で埋め込み実行
 * 4. id/themeが変わったら既存コンテンツをクリアして再生成
 *
 * @example
 * ```tsx
 * <TweetEmbed id="1234567890123456789" />
 * ```
 */
export function TweetEmbed({ id, className }: TweetEmbedProps) {
	const { theme } = useTheme();
	const containerRef = useRef<HTMLDivElement>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// ローディング状態をリセット
		setIsLoading(true);

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
						setIsLoading(false);
					});
				}
			};
			document.body.appendChild(script);
		} else {
			if (window.twttr?.widgets) {
				window.twttr.widgets.load(container).then(() => {
					setIsLoading(false);
				});
			}
		}
	}, [id, theme]);

	return (
		<div className={className}>
			{isLoading && <TweetSkeleton />}
			<div
				ref={containerRef}
				style={{ display: isLoading ? "none" : "block" }}
			/>
		</div>
	);
}

/**
 * ツイート読み込み中のスケルトン表示
 *
 * @description
 * ツイートが読み込まれるまでの間、スケルトンを表示する。
 * 実際のツイートの高さに近い形状で表示してLayout Shiftを最小限に抑える。
 * 画像付きツイートを想定した大きめのサイズ。
 */
function TweetSkeleton() {
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

				{/* テキスト部分（行数を増やして現実的に） */}
				<div className="space-y-2 pt-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-11/12" />
					<Skeleton className="h-4 w-10/12" />
					<Skeleton className="h-4 w-3/4" />
				</div>

				{/* 画像プレースホルダー（多くのツイートに画像が含まれる） */}
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
