"use client";

import { Suspense } from "react";

import { Skeleton } from "../skeleton/skeleton";

/**
 * YouTubeEmbedコンポーネントのプロパティ
 */
export interface YouTubeEmbedProps {
	/** ビデオID（YouTubeのビデオID） */
	videoId: string;
	/** 開始時刻（秒） */
	startTime?: number;
	/** 追加のCSSクラス */
	className?: string;
}

/**
 * YouTube埋め込みコンポーネント
 *
 * @description
 * YouTubeの動画を埋め込み表示するコンポーネント。
 * プライバシー強化モード（youtube-nocookie.com）を使用。
 *
 * @features
 * 1. プライバシー強化モード（youtube-nocookie.com）
 * 2. レスポンシブデザイン（aspect-ratio: 16/9）
 * 3. タイムスタンプ対応
 * 4. カスタムプレーヤー設定（自動再生無効、コントロール表示など）
 * 5. ロード中状態の表示
 * 6. アクセシビリティ対応
 *
 * @example
 * ```tsx
 * <YouTubeEmbed videoId="dQw4w9WgXcQ" />
 * ```
 *
 * @example
 * ```tsx
 * // タイムスタンプ付き
 * <YouTubeEmbed videoId="dQw4w9WgXcQ" startTime={123} />
 * ```
 */
export function YouTubeEmbed({
	videoId,
	startTime,
	className,
}: YouTubeEmbedProps) {
	// URLパラメータの構築
	const params = new URLSearchParams({
		// 自動再生無効
		autoplay: "0",
		// コントロール表示
		controls: "1",
		// YouTubeロゴを最小限に
		modestbranding: "1",
		// 関連動画を同じチャンネルのみに
		rel: "0",
		// 開始時刻（指定がある場合）
		...(startTime !== undefined && { start: startTime.toString() }),
	});

	const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;

	return (
		<div className={className}>
			<Suspense fallback={<YouTubeSkeleton />}>
				<div className="flex justify-center my-6">
					<div className="w-full max-w-3xl">
						{/* レスポンシブな16:9のアスペクト比コンテナ */}
						<div
							className="relative w-full"
							style={{ paddingBottom: "56.25%" }}
						>
							<iframe
								src={embedUrl}
								title="YouTube video player"
								allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
								referrerPolicy="strict-origin-when-cross-origin"
								allowFullScreen
								className="absolute top-0 left-0 w-full h-full rounded-lg border border-border"
							/>
						</div>
					</div>
				</div>
			</Suspense>
		</div>
	);
}

/**
 * YouTube読み込み中のスケルトン表示
 *
 * @description
 * YouTubeが読み込まれるまでの間、スケルトンを表示する。
 * 16:9のアスペクト比で表示。
 */
function YouTubeSkeleton() {
	return (
		<div className="flex justify-center my-6">
			<div className="w-full max-w-3xl">
				{/* レスポンシブな16:9のアスペクト比コンテナ */}
				<div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
					<Skeleton className="absolute top-0 left-0 w-full h-full rounded-lg" />
				</div>
			</div>
		</div>
	);
}
