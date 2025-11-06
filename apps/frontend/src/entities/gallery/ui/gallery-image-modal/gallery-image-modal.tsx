"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui";

import { useGetArticlesByGalleryImage } from "../../api/use-get-articles-by-gallery-image/use-get-articles-by-gallery-image";
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

	// ギャラリー画像を使用している記事一覧を取得
	const { data: articlesData } = useGetArticlesByGalleryImage(
		image?.id ?? null
	);

	if (!image) {
		return null;
	}

	// 現在のロケールに対応する翻訳を取得
	const translation = image.translations.find((t) => t.language === locale);
	const title = translation?.title || `Image ${image.id}`;
	const description = translation?.description;

	// Cloudflare Images の URL を構築（xlarge バリアント）
	const imageUrl = `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${image.cfImageId}/xlarge`;

	// 公開済み記事のみフィルタリング
	const publishedArticles =
		articlesData?.articles.filter(
			(article) => article.status === "published"
		) ?? [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto data-[state=open]:!slide-in-from-left-0 data-[state=open]:!slide-in-from-top-0 data-[state=closed]:!slide-out-to-left-0 data-[state=closed]:!slide-out-to-top-0">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
					{image.takenAt && (
						<div className="text-sm text-muted-foreground">
							撮影日時: {new Date(image.takenAt).toLocaleDateString(locale)}
						</div>
					)}
				</DialogHeader>

				{/* 記事リンクセクション */}
				{publishedArticles.length > 0 && (
					<div className="border-t pt-4 mt-4">
						<h3 className="text-sm font-medium mb-3">
							この画像を使用している記事
						</h3>
						<ul className="space-y-2">
							{publishedArticles.map((article) => (
								<li key={article.id}>
									<Link
										href={`/${locale}/blog/${article.slug}`}
										className="text-sm text-primary hover:underline block"
									>
										{article.title}
									</Link>
								</li>
							))}
						</ul>
					</div>
				)}

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
			</DialogContent>
		</Dialog>
	);
}
