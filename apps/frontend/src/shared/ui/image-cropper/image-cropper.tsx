"use client";

import { Crop, Square } from "lucide-react";
import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "../button/button";
import { getCroppedImg } from "./crop-image";

/**
 * ImageCropperコンポーネントのProps
 */
export interface ImageCropperProps {
	/** クロップする画像のURL（blob URLまたはhttp(s) URL） */
	imageSrc: string;
	/** クロップ完了時のコールバック */
	onCropComplete: (croppedBlob: Blob) => void;
	/** キャンセル時のコールバック */
	onCancel: () => void;
}

/**
 * 画像クロップコンポーネント
 *
 * @description
 * react-easy-cropを使用した画像クロッピング機能を提供する。
 * 以下の機能をサポート:
 * - ドラッグでクロップ範囲を調整
 * - 自由な矩形選択 or 正方形モード切り替え
 * - クロップ実行・キャンセル
 *
 * @example
 * ```tsx
 * <ImageCropper
 *   imageSrc={blobUrl}
 *   onCropComplete={(blob) => console.log('Cropped:', blob)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 * ```
 */
export function ImageCropper({
	imageSrc,
	onCropComplete,
	onCancel,
}: ImageCropperProps) {
	// 1. クロップ位置の状態
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	// 2. クロップ範囲のピクセル座標
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
	// 3. アスペクト比の状態（undefinedで自由に調整可能）
	const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
	// 4. 処理中フラグ
	const [isProcessing, setIsProcessing] = useState(false);

	/**
	 * クロップ範囲変更時のコールバック
	 */
	const onCropCompleteCallback = useCallback(
		(_croppedArea: Area, croppedAreaPixels: Area) => {
			setCroppedAreaPixels(croppedAreaPixels);
		},
		[]
	);

	/**
	 * 正方形モード切り替え
	 */
	const toggleSquareMode = () => {
		setAspectRatio((prev) => (prev === 1 ? undefined : 1));
	};

	/**
	 * クロップ実行
	 */
	const handleCrop = async () => {
		if (!croppedAreaPixels) return;

		try {
			setIsProcessing(true);
			const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
			onCropComplete(croppedBlob);
		} catch (error) {
			console.error("画像のクロップに失敗しました:", error);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="flex h-full flex-col">
			{/* 1. クロッパーエリア */}
			<div className="relative flex-1 bg-black">
				<Cropper
					image={imageSrc}
					crop={crop}
					zoom={1}
					aspect={aspectRatio}
					onCropChange={setCrop}
					onCropComplete={onCropCompleteCallback}
				/>
			</div>

			{/* 2. コントロールエリア */}
			<div className="space-y-4 bg-background p-4">
				{/* ボタングループ */}
				<div className="flex flex-wrap gap-2">
					{/* アスペクト比切り替え */}
					<Button
						type="button"
						variant={aspectRatio === 1 ? "default" : "outline"}
						size="sm"
						onClick={toggleSquareMode}
					>
						<Square className="mr-2 size-4" />
						正方形
					</Button>

					{/* キャンセル */}
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={isProcessing}
						className="ml-auto"
					>
						キャンセル
					</Button>

					{/* クロップ実行 */}
					<Button
						type="button"
						onClick={handleCrop}
						disabled={isProcessing || !croppedAreaPixels}
					>
						<Crop className="mr-2 size-4" />
						{isProcessing ? "処理中..." : "クロップ"}
					</Button>
				</div>
			</div>
		</div>
	);
}
