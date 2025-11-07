"use client";

import type { Map as MapboxGLMap } from "mapbox-gl";
import { useEffect, useState } from "react";
import type {
	MapMouseEvent,
	MarkerDragEvent,
	ViewState,
	ViewStateChangeEvent,
} from "react-map-gl/mapbox";
import MapboxMap, { Marker } from "react-map-gl/mapbox";

import { env } from "@/env";

/**
 * 座標の型定義
 */
export type Coordinates = {
	/** 緯度 */
	latitude: number;
	/** 経度 */
	longitude: number;
};

/**
 * Mapboxコンポーネントのプロパティ
 */
export interface MapboxProps {
	/** 地図の中心座標（初期値）*/
	center?: Coordinates;
	/** マーカーの座標 */
	marker?: Coordinates | null;
	/** 地図のズームレベル（デフォルト: 14）*/
	zoom?: number;
	/** 地図の高さ（デフォルト: 400px）*/
	height?: string | number;
	/** 地図の最小幅 */
	minWidth?: string | number;
	/** 地図のクリック時のコールバック */
	onMapClick?: (coordinates: Coordinates) => void;
	/** マーカーのドラッグ時のコールバック */
	onMarkerDrag?: (coordinates: Coordinates) => void;
	/** ドラッグ可能なマーカーかどうか（デフォルト: true）*/
	draggableMarker?: boolean;
	/** クラス名 */
	className?: string;
}

/**
 * Mapbox地図コンポーネント
 *
 * @description
 * react-map-glを使用したインタラクティブな地図コンポーネント。
 * クリックやドラッグで座標を設定できる。
 *
 * 機能:
 * - 地図の表示
 * - クリックで座標を設定
 * - ドラッグ可能なマーカー
 * - ズーム、パン操作
 *
 * @example
 * ```tsx
 * <Mapbox
 *   center={{ latitude: 35.6762, longitude: 139.6503 }}
 *   marker={{ latitude: 35.6762, longitude: 139.6503 }}
 *   onMapClick={(coords) => console.log('Clicked:', coords)}
 *   onMarkerDrag={(coords) => console.log('Dragged:', coords)}
 * />
 * ```
 */
export function Mapbox({
	center = { latitude: 35.6812, longitude: 139.7671 }, // デフォルト: 東京駅
	marker,
	zoom = 14,
	height = "400px",
	minWidth,
	onMapClick,
	onMarkerDrag,
	draggableMarker = true,
	className,
}: MapboxProps) {
	// 地図の表示状態（ビューポート）を管理
	const [viewState, setViewState] = useState<Partial<ViewState>>({
		latitude: center.latitude,
		longitude: center.longitude,
		zoom,
	});

	/**
	 * マーカーの位置が変更されたら地図の中心を移動
	 *
	 * @description
	 * 住所検索で座標が設定された場合など、外部からマーカー位置が変更されたときに
	 * 地図の中心も同じ位置に移動する。これによりユーザーが手動で地図をパンする必要がなくなる。
	 */
	useEffect(() => {
		if (marker) {
			setViewState((prev) => ({
				...prev,
				latitude: marker.latitude,
				longitude: marker.longitude,
			}));
		}
	}, [marker]);

	/**
	 * 地図クリック時のハンドラー
	 *
	 * @param event - マップクリックイベント
	 */
	const handleMapClick = (event: MapMouseEvent) => {
		const { lng, lat } = event.lngLat;
		onMapClick?.({ latitude: lat, longitude: lng });
	};

	/**
	 * マーカードラッグ終了時のハンドラー
	 *
	 * @param event - ドラッグイベント
	 */
	const handleMarkerDragEnd = (event: MarkerDragEvent) => {
		const { lng, lat } = event.lngLat;
		onMarkerDrag?.({ latitude: lat, longitude: lng });
	};

	/**
	 * 地図ロード時のハンドラー
	 *
	 * @description
	 * 地図がロードされたら、以下の処理を行う：
	 * 1. POI（Points of Interest）レイヤーを非表示にする
	 *    - Mapbox Streets-v12スタイルのデフォルトPOIマーカー（青い丸）を削除
	 *    - レストラン、ショップ、公園などの施設マーカーが非表示になる
	 * 2. テキストレイヤーの言語を日本語に変更する
	 *    - 地名や道路名などが日本語で表示される
	 */
	const handleMapLoad = (event: { target: MapboxGLMap }) => {
		const map = event.target;
		const style = map.getStyle();

		if (style?.layers) {
			for (const layer of style.layers) {
				// POIレイヤーのアイコンを非表示にする（青い丸のマーカーを削除）
				// icon-image を持つレイヤー = アイコンマーカーを表示するレイヤー
				if (
					layer.type === "symbol" &&
					layer.layout?.["icon-image"] &&
					layer.id.includes("poi")
				) {
					map.setLayoutProperty(layer.id, "visibility", "none");
				}

				// テキストレイヤーの言語を日本語に変更
				if (layer.type === "symbol" && layer.layout?.["text-field"]) {
					map.setLayoutProperty(layer.id, "text-field", [
						"coalesce",
						["get", "name_ja"],
						["get", "name"],
					]);
				}
			}
		}
	};

	return (
		<div className={className} style={{ height, minWidth }}>
			<MapboxMap
				{...viewState}
				onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
				onClick={handleMapClick}
				onLoad={handleMapLoad}
				mapStyle="mapbox://styles/mapbox/streets-v12"
				mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
				style={{ width: "100%", height: "100%" }}
			>
				{/* マーカー表示 */}
				{marker && (
					<Marker
						latitude={marker.latitude}
						longitude={marker.longitude}
						draggable={draggableMarker}
						onDragEnd={handleMarkerDragEnd}
					>
						<div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="w-5 h-5 text-primary-foreground"
								role="img"
								aria-label="地図マーカー"
							>
								<title>地図マーカー</title>
								<path
									fillRule="evenodd"
									d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
					</Marker>
				)}
			</MapboxMap>
		</div>
	);
}
