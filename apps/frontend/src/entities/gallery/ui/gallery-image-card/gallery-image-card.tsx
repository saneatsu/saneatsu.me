"use client";

import Image from "next/image";
import { useLocale } from "next-intl";

import { Card, CardContent } from "@/shared/ui";

import type { GalleryImage } from "../../model/types";

/**
 * ギャラリー画像カードのプロパティ
 */
interface GalleryImageCardProps {
	/** ギャラリー画像データ */
	image: GalleryImage;
	/** クリック時のコールバック */
	onClick?: (image: GalleryImage) => void;
}

/**
 * ギャラリー画像カードコンポーネント
 *
 * @description
 * ギャラリー画像を表示するカードコンポーネント。
 * Cloudflare Images の medium バリアント（800px）を使用。
 * クリックすると拡大モーダルを表示。
 */
export function GalleryImageCard({ image, onClick }: GalleryImageCardProps) {
	const locale = useLocale();

	// 現在のロケールに対応する翻訳を取得
	const translation = image.translations.find((t) => t.language === locale);
	const title = translation?.title || `Image ${image.id}`;

	// Cloudflare Images の URL を構築（large バリアント）
	const imageUrl = `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${image.cfImageId}/large`;

	const handleClick = () => onClick?.(image);

	return (
		<button
			type="button"
			className="cursor-pointer transition-transform hover:scale-105 border-0 p-0 bg-transparent text-left w-full"
			onClick={handleClick}
		>
			<Card className="shadow-xs aspect-square p-0">
				<CardContent className="p-0 h-full">
					<div className="relative h-full overflow-hidden rounded-lg">
						<Image
							src={imageUrl}
							alt={title}
							fill
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							className="object-contain"
						/>
					</div>
				</CardContent>
			</Card>
			{title && (
				<div className="py-4 pl-1 pr-4">
					<p className="text-xs text-muted-foreground mb-1 min-h-[1.25rem]">
						{image.takenAt
							? new Date(image.takenAt).toLocaleDateString(locale)
							: "\u00A0"}
					</p>
					<h3 className="text-sm font-medium line-clamp-2">{title}</h3>
				</div>
			)}
		</button>
	);
}
