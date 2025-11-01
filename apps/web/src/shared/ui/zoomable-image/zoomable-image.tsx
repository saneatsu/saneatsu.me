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
	/** 記事内の全画像URLリスト（省略可） */
	images?: string[];
	/** 現在の画像のインデックス（省略可） */
	currentIndex?: number;
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
 * 複数画像が提供されている場合、矢印ボタンで前後の画像に移動可能。
 *
 * @param props.src - 画像のURL
 * @param props.alt - 画像の代替テキスト
 * @param props.className - 追加のCSSクラス
 * @param props.images - 記事内の全画像URLリスト（省略可）
 * @param props.currentIndex - 現在の画像のインデックス（省略可）
 */
export function ZoomableImage({
	src,
	alt,
	className,
	images,
	currentIndex,
}: ZoomableImageProps) {
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

	/**
	 * Lightbox用のスライドを生成
	 *
	 * 1. imagesが提供されている場合、全画像のスライドを作成
	 * 2. 各画像のバリアントを1段階上げたURLを使用
	 * 3. 提供されていない場合は従来通り単一画像のみ
	 */
	const slides = images?.map((url) => {
		const id = extractImageId(url);
		const variant = extractVariant(url);
		const nextVariant = getNextVariant(variant);
		const lbUrl = id ? getImageUrl(id, nextVariant) : url;
		return { src: lbUrl };
	}) || [{ src: lightboxUrl }];

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
				slides={slides}
				index={currentIndex}
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
