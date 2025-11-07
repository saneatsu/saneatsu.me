"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import type { Map as MapboxGLMap } from "mapbox-gl";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { ViewState, ViewStateChangeEvent } from "react-map-gl/mapbox";
import MapboxMap, { Marker } from "react-map-gl/mapbox";

import { env } from "@/env";

import type { GalleryImage } from "../../model/types";

/**
 * GalleryMapコンポーネントのプロパティ
 */
export interface GalleryMapProps {
	/** 表示する画像リスト */
	images: GalleryImage[];
	/** マーカークリック時のコールバック */
	onImageClick?: (image: GalleryImage) => void;
	/** 地図の高さ（デフォルト: 500px）*/
	height?: string | number;
	/** クラス名 */
	className?: string;
}

/**
 * ギャラリー画像を地図上に表示するコンポーネント
 *
 * @description
 * 処理フロー:
 * 1. 位置情報がある画像のみマーカー表示
 * 2. 初期表示時に全マーカーが見える範囲に自動フィット
 * 3. マーカークリックで画像モーダルを表示
 *
 * @example
 * ```tsx
 * <GalleryMap
 *   images={galleryImages}
 *   onImageClick={(image) => openModal(image)}
 *   height="600px"
 * />
 * ```
 */
export function GalleryMap({
	images,
	onImageClick,
	height = "500px",
	className,
}: GalleryMapProps) {
	// 位置情報がある画像のみ抽出
	const imagesWithLocation = images.filter(
		(img) => img.latitude !== null && img.longitude !== null
	);

	/**
	 * 画像の位置情報から初期表示範囲を計算
	 *
	 * @description
	 * 処理フロー：
	 * 1. 位置情報がない場合：デフォルト（東京駅）を表示
	 * 2. 1つの画像の場合：その位置にズーム12で表示
	 * 3. 複数の画像の場合：全画像が見える中心とズームレベルを計算
	 */
	const initialViewState = useMemo<Partial<ViewState>>(() => {
		// 位置情報がある画像が0件の場合はデフォルト
		if (imagesWithLocation.length === 0) {
			return {
				latitude: 35.6812, // デフォルト: 東京駅
				longitude: 139.7671,
				zoom: 5,
			};
		}

		// 1つのマーカーしかない場合はそこにズーム
		if (imagesWithLocation.length === 1) {
			return {
				latitude: imagesWithLocation[0].latitude as number,
				longitude: imagesWithLocation[0].longitude as number,
				zoom: 12,
			};
		}

		// 複数マーカーの場合は全体が見える範囲を計算
		const bounds = imagesWithLocation.reduce(
			(acc, img) => {
				const lat = img.latitude as number;
				const lng = img.longitude as number;

				return {
					minLat: Math.min(acc.minLat, lat),
					maxLat: Math.max(acc.maxLat, lat),
					minLng: Math.min(acc.minLng, lng),
					maxLng: Math.max(acc.maxLng, lng),
				};
			},
			{
				minLat: Number.POSITIVE_INFINITY,
				maxLat: Number.NEGATIVE_INFINITY,
				minLng: Number.POSITIVE_INFINITY,
				maxLng: Number.NEGATIVE_INFINITY,
			}
		);

		// 中心座標を計算
		const centerLat = (bounds.minLat + bounds.maxLat) / 2;
		const centerLng = (bounds.minLng + bounds.maxLng) / 2;

		// 緯度経度の差分から適切なズームレベルを計算
		const latDiff = bounds.maxLat - bounds.minLat;
		const lngDiff = bounds.maxLng - bounds.minLng;
		const maxDiff = Math.max(latDiff, lngDiff);

		// ズームレベルの計算（おおよその値）
		// 差分が大きいほどズームアウトする
		let zoom = 10;
		if (maxDiff > 10) zoom = 5;
		else if (maxDiff > 5) zoom = 6;
		else if (maxDiff > 2) zoom = 7;
		else if (maxDiff > 1) zoom = 8;
		else if (maxDiff > 0.5) zoom = 9;

		return {
			latitude: centerLat,
			longitude: centerLng,
			zoom,
		};
	}, [imagesWithLocation]);

	// 地図の表示状態（ビューポート）を管理
	const [viewState, setViewState] =
		useState<Partial<ViewState>>(initialViewState);

	/**
	 * 地図ロード時のハンドラー
	 *
	 * @description
	 * 地図がロードされたら、以下の処理を行う：
	 * 1. POI（Points of Interest）レイヤーを非表示にする
	 * 2. テキストレイヤーの言語を日本語に変更する
	 */
	const handleMapLoad = (event: { target: MapboxGLMap }) => {
		const loadedMap = event.target;
		const style = loadedMap.getStyle();

		if (style?.layers) {
			for (const layer of style.layers) {
				// POIレイヤーのアイコンを非表示にする
				if (
					layer.type === "symbol" &&
					layer.layout?.["icon-image"] &&
					layer.id.includes("poi")
				) {
					loadedMap.setLayoutProperty(layer.id, "visibility", "none");
				}

				// テキストレイヤーの言語を日本語に変更
				if (layer.type === "symbol" && layer.layout?.["text-field"]) {
					loadedMap.setLayoutProperty(layer.id, "text-field", [
						"coalesce",
						["get", "name_ja"],
						["get", "name"],
					]);
				}
			}
		}
	};

	// 位置情報がある画像が0件の場合は地図を表示しない
	if (imagesWithLocation.length === 0) {
		return (
			<div className={className} style={{ height }}>
				<div className="flex items-center justify-center h-full bg-muted rounded-lg">
					<p className="text-muted-foreground">
						位置情報を持つ画像がありません
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`${className} rounded-lg overflow-hidden`}
			style={{ height }}
		>
			<MapboxMap
				{...viewState}
				onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
				onLoad={handleMapLoad}
				mapStyle="mapbox://styles/mapbox/streets-v12"
				mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
				style={{ width: "100%", height: "100%" }}
			>
				{/* 各画像のマーカーを表示 */}
				{imagesWithLocation.map((image) => (
					<Marker
						key={image.id}
						latitude={image.latitude as number}
						longitude={image.longitude as number}
						onClick={() => onImageClick?.(image)}
						anchor="bottom"
					>
						<div className="relative cursor-pointer hover:scale-110 transition-transform group">
							{/* 写真サムネイル */}
							<div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-black shadow-xl relative">
								<Image
									src={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${image.cfImageId}/small`}
									alt={
										image.translations.find((t) => t.language === "ja")
											?.title || ""
									}
									fill
									className="object-cover"
									sizes="64px"
								/>
							</div>
							{/* 下向き三角形の吹き出し */}
							<div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-black" />
						</div>
					</Marker>
				))}
			</MapboxMap>
		</div>
	);
}
