"use client";

import { useTheme } from "next-themes";
import { Suspense } from "react";
import { Tweet } from "react-tweet";

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
 * react-tweetライブラリを使用して実装。
 *
 * @features
 * 1. ライト/ダークテーマ対応
 * 2. ロード中状態の表示
 * 3. レスポンシブデザイン
 * 4. エラーハンドリング
 *
 * @example
 * ```tsx
 * <TweetEmbed id="1234567890123456789" />
 * ```
 */
export function TweetEmbed({ id, className }: TweetEmbedProps) {
	const { theme } = useTheme();

	return (
		<div className={className} data-theme={theme === "dark" ? "dark" : "light"}>
			<Suspense fallback={<TweetSkeleton />}>
				<div className="flex justify-center my-6">
					<Tweet id={id} />
				</div>
			</Suspense>
		</div>
	);
}

/**
 * ツイート読み込み中のスケルトン表示
 *
 * @description
 * ツイートが読み込まれるまでの間、スケルトンを表示する。
 * ツイートの一般的なレイアウトに近い形状で表示。
 */
function TweetSkeleton() {
	return (
		<div className="flex justify-center my-6">
			<div className="w-full max-w-[550px] border rounded-xl p-4 space-y-3">
				{/* ヘッダー部分 */}
				<div className="flex items-center space-x-2">
					<Skeleton className="h-12 w-12 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>

				{/* テキスト部分 */}
				<div className="space-y-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</div>

				{/* フッター部分 */}
				<div className="flex justify-between pt-2">
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-4 w-12" />
				</div>
			</div>
		</div>
	);
}
