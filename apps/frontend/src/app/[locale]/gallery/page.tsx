"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import type { GalleryImage } from "@/entities/gallery";
import {
	GalleryImageCard,
	GalleryImageModal,
	GalleryMap,
	useGalleryImages,
} from "@/entities/gallery";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui";

/**
 * ギャラリー一覧ページ
 *
 * @description
 * 処理フロー:
 * 1. useGalleryImages フックでギャラリー画像一覧を取得
 * 2. グリッドレイアウトで画像カードを表示
 * 3. 画像クリックで拡大モーダルを表示
 * 4. ページネーションで次ページ・前ページに移動
 */
export default function GalleryPage() {
	const t = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [page, setPage] = useState(1);
	const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [hoveredImageId, setHoveredImageId] = useState<number | null>(null);

	const { data, isLoading, error } = useGalleryImages({
		page: String(page),
		limit: "18",
		sortOrder: "desc",
	});

	/**
	 * 初期表示時にURLクエリパラメータから画像IDを取得してモーダルを開く
	 */
	useEffect(() => {
		const imageId = searchParams.get("image");
		if (imageId && data?.images) {
			const image = data.images.find((img) => img.id === Number(imageId));
			if (image) {
				setSelectedImage(image);
				setIsModalOpen(true);
			}
		}
	}, [searchParams, data]);

	const handleImageClick = (image: GalleryImage) => {
		setSelectedImage(image);
		setIsModalOpen(true);
		// URLにクエリパラメータを追加
		const params = new URLSearchParams(searchParams.toString());
		params.set("image", String(image.id));
		router.push(`?${params.toString()}`, { scroll: false });
	};

	const handleImageHover = (imageId: number | null) => {
		setHoveredImageId(imageId);
	};

	const handleModalClose = () => {
		setIsModalOpen(false);
		setSelectedImage(null);
		// URLからクエリパラメータを削除
		const params = new URLSearchParams(searchParams.toString());
		params.delete("image");
		const queryString = params.toString();
		router.push(queryString ? `?${queryString}` : pathname, {
			scroll: false,
		});
	};

	const handlePreviousPage = () => {
		if (page > 1) {
			setPage(page - 1);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	const handleNextPage = () => {
		if (data && page < Math.ceil(data.total / data.limit)) {
			setPage(page + 1);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	if (error) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-destructive">エラー</h1>
					<p className="mt-2 text-muted-foreground">{error.message}</p>
				</div>
			</div>
		);
	}

	// スケルトンローダー用のプレースホルダー配列
	const skeletonItems = Array.from({ length: 18 }, (_, i) => ({
		id: `skeleton-${i}`,
	}));

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8">{t("gallery.title")}</h1>

			{isLoading ? (
				<>
					{/* モバイル: タブ表示 */}
					<div className="lg:hidden">
						<Tabs defaultValue="list" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="list">リスト</TabsTrigger>
								<TabsTrigger value="map">地図</TabsTrigger>
							</TabsList>
							<TabsContent value="list" className="mt-4">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{skeletonItems.map((item) => (
										<div
											key={item.id}
											className="aspect-square bg-muted animate-pulse rounded-lg"
										/>
									))}
								</div>
							</TabsContent>
							<TabsContent value="map" className="mt-4">
								<div className="bg-muted animate-pulse rounded-lg h-[600px]" />
							</TabsContent>
						</Tabs>
					</div>

					{/* デスクトップ: 2カラム表示 */}
					<div className="hidden lg:grid lg:grid-cols-[60%_40%] lg:gap-8">
						{/* 左側: 画像グリッドスケルトン */}
						<div>
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
								{skeletonItems.map((item) => (
									<div
										key={item.id}
										className="aspect-square bg-muted animate-pulse rounded-lg"
									/>
								))}
							</div>
						</div>

						{/* 右側: 地図スケルトン */}
						<div className="sticky top-20 h-fit">
							<div
								className="bg-muted animate-pulse rounded-lg"
								style={{ height: "calc(100vh - 12rem)" }}
							/>
						</div>
					</div>
				</>
			) : data && data.images.length > 0 ? (
				<>
					{/* モバイル: タブ表示 */}
					<div className="lg:hidden">
						<Tabs defaultValue="list" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="list">リスト</TabsTrigger>
								<TabsTrigger value="map">地図</TabsTrigger>
							</TabsList>
							<TabsContent value="list" className="mt-4">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{data.images.map((image) => (
										<GalleryImageCard
											key={image.id}
											image={image}
											onClick={handleImageClick}
											hoveredImageId={hoveredImageId}
											onHover={handleImageHover}
										/>
									))}
								</div>
							</TabsContent>
							<TabsContent value="map" className="mt-4">
								<GalleryMap
									images={data.images}
									onImageClick={handleImageClick}
									hoveredImageId={hoveredImageId}
									onHover={handleImageHover}
									height="600px"
								/>
							</TabsContent>
						</Tabs>
					</div>

					{/* デスクトップ: 2カラム表示 */}
					<div className="hidden lg:grid lg:grid-cols-[60%_40%] lg:gap-8">
						{/* 左側: 画像グリッド */}
						<div>
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
								{data.images.map((image) => (
									<GalleryImageCard
										key={image.id}
										image={image}
										onClick={handleImageClick}
										hoveredImageId={hoveredImageId}
										onHover={handleImageHover}
									/>
								))}
							</div>
						</div>

						{/* 右側: 地図（固定位置） */}
						<div className="sticky top-20 h-fit">
							<GalleryMap
								images={data.images}
								onImageClick={handleImageClick}
								hoveredImageId={hoveredImageId}
								onHover={handleImageHover}
								height="calc(100vh - 12rem)"
							/>
						</div>
					</div>

					{/* ページネーション */}
					<div className="mt-8 flex items-center justify-center gap-4">
						<Button
							variant="outline"
							onClick={handlePreviousPage}
							disabled={page === 1}
						>
							前へ
						</Button>
						<span className="text-sm text-muted-foreground">
							ページ {page} / {Math.ceil(data.total / data.limit)}
						</span>
						<Button
							variant="outline"
							onClick={handleNextPage}
							disabled={page >= Math.ceil(data.total / data.limit)}
						>
							次へ
						</Button>
					</div>
				</>
			) : (
				<div className="text-center text-muted-foreground">
					<p>画像が見つかりませんでした</p>
				</div>
			)}

			{/* 画像拡大モーダル */}
			<GalleryImageModal
				image={selectedImage}
				open={isModalOpen}
				onOpenChange={handleModalClose}
			/>
		</div>
	);
}
