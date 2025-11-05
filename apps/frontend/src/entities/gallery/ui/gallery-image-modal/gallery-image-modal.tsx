"use client";

import Image from "next/image";
import { useLocale } from "next-intl";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui";

import type { GalleryImage } from "../../model/types";

/**
 * ギャラリー画像モーダルのプロパティ
 */
interface GalleryImageModalProps {
	/** 表示する画像データ */
	image: GalleryImage | null;
	/** モーダルの開閉状態 */
	open: boolean;
	/** モーダルを閉じる時のコールバック */
	onOpenChange: (open: boolean) => void;
}

/**
 * ギャラリー画像拡大モーダルコンポーネント
 *
 * @description
 * ギャラリー画像を拡大表示するモーダル。
 * Cloudflare Images の xlarge バリアント（1600px）を使用。
 */
export function GalleryImageModal({
	image,
	open,
	onOpenChange,
}: GalleryImageModalProps) {
	const locale = useLocale();

	if (!image) {
		return null;
	}

	// 現在のロケールに対応する翻訳を取得
	const translation = image.translations.find((t) => t.language === locale);
	const title = translation?.title || `Image ${image.id}`;
	const description = translation?.description;

	// Cloudflare Images の URL を構築（xlarge バリアント）
	const imageUrl = `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${image.cfImageId}/xlarge`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				<div className="relative w-full aspect-square">
					<Image
						src={imageUrl}
						alt={title}
						fill
						sizes="(max-width: 1200px) 100vw, 1200px"
						className="object-contain"
						priority
					/>
				</div>
				{image.takenAt && (
					<div className="text-sm text-muted-foreground">
						撮影日時: {new Date(image.takenAt).toLocaleDateString(locale)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
