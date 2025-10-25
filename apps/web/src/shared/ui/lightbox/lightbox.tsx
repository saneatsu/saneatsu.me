"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Dialog, DialogContent } from "../dialog/dialog";

/**
 * Lightboxのプロパティ
 */
export interface LightboxProps {
	/** 表示する画像のURL（xlarge variant推奨） */
	imageUrl: string;
	/** 画像の代替テキスト */
	alt?: string;
	/** Lightboxを開くかどうか */
	open: boolean;
	/** Lightboxを閉じるときのコールバック */
	onClose: () => void;
	/** ローディング状態を強制的に表示し続けるかどうか（Storybook用） */
	forceLoading?: boolean;
}

/**
 * 画像拡大表示用のLightboxコンポーネント
 *
 * @description
 * 記事内の画像をクリックで拡大表示するためのモーダルコンポーネント。
 * shadcn/uiのDialogを使用して実装されている。
 *
 * 機能：
 * 1. xlarge variant（1600px）で画像を拡大表示
 * 2. アスペクト比を維持（object-fit: contain）
 * 3. ESCキーで閉じる（Dialogのデフォルト機能）
 * 4. 背景クリックで閉じる（Dialogのデフォルト機能）
 * 5. スムーズなズームイン・アウトアニメーション（Dialogのデフォルト機能）
 * 6. 画面サイズに応じた表示（max-w-[90vw], max-h-[90vh]）
 * 7. ローディング状態表示
 *
 * @example
 * ```tsx
 * const [lightboxOpen, setLightboxOpen] = useState(false);
 *
 * <img
 *   src={mediumUrl}
 *   onClick={() => setLightboxOpen(true)}
 * />
 *
 * <Lightbox
 *   imageUrl={xlargeUrl}
 *   alt="画像の説明"
 *   open={lightboxOpen}
 *   onClose={() => setLightboxOpen(false)}
 * />
 * ```
 */
export function Lightbox({
	imageUrl,
	alt,
	open,
	onClose,
	forceLoading = false,
}: LightboxProps) {
	const t = useTranslations();
	const [isLoading, setIsLoading] = useState(true);

	// forceLoadingがtrueの場合は常にローディング状態を表示
	const showLoading = forceLoading || isLoading;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="p-0 border-0 flex items-center justify-center max-w-dvw">
				{showLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-background z-10">
						<div className="animate-pulse text-muted-foreground">
							{t("loading")}
						</div>
					</div>
				)}
				<div className="relative" style={{ width: "90vw", height: "90vh" }}>
					<Image
						src={imageUrl}
						alt={alt || ""}
						fill
						sizes="90vw"
						style={{ objectFit: "contain" }}
						onLoad={() => setIsLoading(false)}
						onError={() => setIsLoading(false)}
						priority
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
