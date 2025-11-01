"use client";

import { useState } from "react";
import YetAnotherLightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import { extractImageId, getImageUrl } from "@/shared/lib";

/**
 * ArticleImageのプロパティ
 */
export interface ArticleImageProps {
	/** 画像のURL（Cloudflare Images URL） */
	src: string;
	/** 画像の代替テキスト */
	alt?: string;
	/** 追加のCSSクラス */
	className?: string;
}

/**
 * 記事内画像コンポーネント
 *
 * @description
 * 記事本文内で使用する画像コンポーネント。
 * Cloudflare Imagesの画像を自然なサイズで表示し、クリックでLightbox拡大表示。
 *
 * 機能：
 * 1. 画像を自然なサイズで表示（横幅いっぱいに引き伸ばさない）
 * 2. クリックでLightbox表示（xlarge variant: 1600px）
 * 3. Lazy loading
 * 4. ホバーエフェクト（opacity-90）
 * 5. カーソルをpointerに変更（クリック可能を示す）
 * 6. 中央揃え
 *
 * @example
 * ```tsx
 * <ArticleImage
 *   src="https://imagedelivery.net/{hash}/{imageId}/original"
 *   alt="記事内の画像"
 * />
 * ```
 */
export function ArticleImage({ src, alt, className = "" }: ArticleImageProps) {
	const [lightboxOpen, setLightboxOpen] = useState(false);

	// Cloudflare Images URLから画像IDを抽出
	const imageId = extractImageId(src);

	// xlarge variant URLを生成（Lightbox用）
	const xlargeUrl = imageId ? getImageUrl(imageId, "xlarge") : src;

	return (
		<>
			<div className="flex justify-center">
				<button
					type="button"
					onClick={() => setLightboxOpen(true)}
					className={`cursor-pointer hover:opacity-90 transition-opacity border-0 bg-transparent p-0 ${className}`}
					aria-label={alt ? `${alt}を拡大表示` : "画像を拡大表示"}
				>
					{/* biome-ignore lint/performance/noImgElement: Cloudflare ImagesのURLは既に最適化されているため<img>を使用 */}
					<img
						src={src}
						alt={alt || ""}
						className="rounded-lg"
						loading="lazy"
					/>
				</button>
			</div>

			<YetAnotherLightbox
				open={lightboxOpen}
				close={() => setLightboxOpen(false)}
				slides={[{ src: xlargeUrl, alt }]}
			/>
		</>
	);
}
