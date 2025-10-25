"use client";

import { useState } from "react";
import YetAnotherLightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import { cn } from "@/shared/lib/utils";

interface ZoomableImageProps {
	/** 画像のURL */
	src: string;
	/** 画像の代替テキスト */
	alt: string;
	/** 追加のCSSクラス */
	className?: string;
}

/**
 * クリックで拡大表示できる画像コンポーネント
 *
 * @description
 * Lightboxコンポーネントを使用して、画像をクリックすると
 * 拡大表示する機能を提供する。
 *
 * @param props.src - 画像のURL
 * @param props.alt - 画像の代替テキスト
 * @param props.className - 追加のCSSクラス
 */
export function ZoomableImage({ src, alt, className }: ZoomableImageProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={cn(
					"cursor-zoom-in rounded-lg my-4 hover:opacity-90 transition-opacity border-0 p-0 bg-transparent",
					className
				)}
			>
				{/* biome-ignore lint/performance/noImgElement: ReactMarkdownから生成される画像は外部URLの可能性があるため<img>を使用 */}
				<img src={src} alt={alt} className="rounded-lg" />
			</button>
			<YetAnotherLightbox
				open={open}
				close={() => setOpen(false)}
				slides={[{ src, alt }]}
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
