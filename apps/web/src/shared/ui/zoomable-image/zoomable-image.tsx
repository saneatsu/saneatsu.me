"use client";

import { useState } from "react";
import YetAnotherLightbox from "yet-another-react-lightbox";

import type { ImageVariant } from "@/shared/lib";
import { cn, extractImageId, getImageUrl } from "@/shared/lib";

interface ZoomableImageProps {
	/** 画像のURL */
	src: string;
	/** 画像の代替テキスト */
	alt: string;
	/** 追加のCSSクラス */
	className?: string;
}

/**
 * URLからバリアント名を抽出する
 *
 * @param url - Cloudflare Images URL
 * @returns バリアント名、抽出できない場合はnull
 *
 * @example
 * extractVariant("https://imagedelivery.net/.../id/original") // => "original"
 */
function extractVariant(url: string): ImageVariant | null {
	const match = url.match(/\/(small|medium|original|large|xlarge)$/);
	return match ? (match[1] as ImageVariant) : null;
}

/**
 * 次のバリアント（1段階上のサイズ）を取得する
 *
 * @param variant - 現在のバリアント
 * @returns 次のバリアント
 *
 * @description
 * スマートサイジングのロジック：
 * - original (800px) → large (1200px)
 * - medium (800px) → large (1200px)
 * - large (1200px) → xlarge (1600px)
 * - xlarge (1600px) → xlarge (1600px、最大サイズ)
 * - null → large (1200px、デフォルト)
 */
function getNextVariant(variant: ImageVariant | null): ImageVariant {
	if (variant === "original" || variant === "medium") {
		return "large";
	}
	if (variant === "large") {
		return "xlarge";
	}
	if (variant === "xlarge") {
		return "xlarge";
	}
	// デフォルト: small または抽出失敗の場合
	return "large";
}

/**
 * クリックで拡大表示できる画像コンポーネント
 *
 * @description
 * Lightboxコンポーネントを使用して、画像をクリックすると
 * 拡大表示する機能を提供する。
 * Lightbox表示時は元の画像バリアントより1段階大きいサイズを表示：
 * - original/medium (800px) → large (1200px)
 * - large (1200px) → xlarge (1600px)
 * - xlarge (1600px) → xlarge (1600px)
 *
 * @param props.src - 画像のURL
 * @param props.alt - 画像の代替テキスト
 * @param props.className - 追加のCSSクラス
 */
export function ZoomableImage({ src, alt, className }: ZoomableImageProps) {
	const [open, setOpen] = useState(false);

	/**
	 * Lightbox表示用のURLを生成
	 *
	 * 1. Cloudflare Images URLから画像IDを抽出
	 * 2. URLから現在のバリアントを抽出
	 * 3. 次のバリアント（1段階上）を決定
	 * 4. 新しいバリアントでURLを再生成
	 * 5. 抽出失敗時は元のURLをそのまま使用
	 */
	const imageId = extractImageId(src);
	const currentVariant = extractVariant(src);
	const lightboxVariant = getNextVariant(currentVariant);
	const lightboxUrl = imageId ? getImageUrl(imageId, lightboxVariant) : src;

	return (
		<>
			<div className="flex justify-center">
				<button
					type="button"
					onClick={() => setOpen(true)}
					className={cn(
						"cursor-zoom-in rounded-lg hover:opacity-90 transition-opacity border-0 p-0 bg-transparent",
						className
					)}
				>
					{/* biome-ignore lint/performance/noImgElement: ReactMarkdownから生成される画像は外部URLの可能性があるため<img>を使用 */}
					<img src={src} alt={alt} className="rounded-lg" />
				</button>
			</div>
			<YetAnotherLightbox
				open={open}
				close={() => setOpen(false)}
				slides={[{ src: lightboxUrl, alt }]}
				controller={{ closeOnBackdropClick: true }}
				styles={{
					container: {
						backdropFilter: "blur(8px)",
						backgroundColor: "rgba(0, 0, 0, 0.6)",
					},
				}}
			/>
		</>
	);
}
