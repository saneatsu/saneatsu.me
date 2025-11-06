"use client";

import { useEffect, useState } from "react";

import { Input } from "../input/input";
import { Label } from "../label/label";
import type { Coordinates } from "../mapbox/mapbox";

/**
 * 座標入力コンポーネントのプロパティ
 */
export interface CoordinatesInputProps {
	/** 現在の座標値 */
	value: Coordinates | null;
	/** 座標変更時のコールバック */
	onChange: (coordinates: Coordinates | null) => void;
	/** 緯度ラベル（デフォルト: "緯度"）*/
	latitudeLabel?: string;
	/** 経度ラベル（デフォルト: "経度"）*/
	longitudeLabel?: string;
	/** クラス名 */
	className?: string;
}

/**
 * 座標入力フィールドの検証結果
 */
type ValidationResult = {
	/** 有効かどうか */
	isValid: boolean;
	/** エラーメッセージ */
	errorMessage?: string;
};

/**
 * 緯度のバリデーション
 *
 * @param value - 検証する緯度の文字列
 * @returns 検証結果
 */
function validateLatitude(value: string): ValidationResult {
	if (!value.trim()) {
		return { isValid: true }; // 空の場合は許可
	}

	const num = Number(value);

	if (Number.isNaN(num)) {
		return {
			isValid: false,
			errorMessage: "数値を入力してください",
		};
	}

	if (num < -90 || num > 90) {
		return {
			isValid: false,
			errorMessage: "緯度は -90 から 90 の範囲で入力してください",
		};
	}

	return { isValid: true };
}

/**
 * 経度のバリデーション
 *
 * @param value - 検証する経度の文字列
 * @returns 検証結果
 */
function validateLongitude(value: string): ValidationResult {
	if (!value.trim()) {
		return { isValid: true }; // 空の場合は許可
	}

	const num = Number(value);

	if (Number.isNaN(num)) {
		return {
			isValid: false,
			errorMessage: "数値を入力してください",
		};
	}

	if (num < -180 || num > 180) {
		return {
			isValid: false,
			errorMessage: "経度は -180 から 180 の範囲で入力してください",
		};
	}

	return { isValid: true };
}

/**
 * 座標入力コンポーネント
 *
 * @description
 * 緯度・経度を入力するフォームフィールド。
 * 入力値のバリデーションを行い、有効な座標のみ親コンポーネントに通知する。
 *
 * @example
 * ```tsx
 * <CoordinatesInput
 *   value={{ latitude: 35.6762, longitude: 139.6503 }}
 *   onChange={(coords) => console.log('Coordinates:', coords)}
 *   latitudeLabel="緯度"
 *   longitudeLabel="経度"
 * />
 * ```
 */
export function CoordinatesInput({
	value,
	onChange,
	latitudeLabel = "緯度",
	longitudeLabel = "経度",
	className,
}: CoordinatesInputProps) {
	// 入力フィールドの値を文字列で管理
	const [latitudeInput, setLatitudeInput] = useState(
		value?.latitude?.toString() ?? ""
	);
	const [longitudeInput, setLongitudeInput] = useState(
		value?.longitude?.toString() ?? ""
	);

	// バリデーション結果
	const [latitudeValidation, setLatitudeValidation] =
		useState<ValidationResult>({ isValid: true });
	const [longitudeValidation, setLongitudeValidation] =
		useState<ValidationResult>({ isValid: true });

	/**
	 * valueプロップの変更を監視して、入力フィールドの状態を同期
	 *
	 * @description
	 * 外部から座標が設定された場合（例: AddressSearchで住所を選択）、
	 * 入力フィールドの表示を更新する。
	 */
	useEffect(() => {
		setLatitudeInput(value?.latitude?.toString() ?? "");
		setLongitudeInput(value?.longitude?.toString() ?? "");
	}, [value]);

	/**
	 * 緯度入力変更ハンドラー
	 */
	const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setLatitudeInput(newValue);

		// バリデーション
		const validation = validateLatitude(newValue);
		setLatitudeValidation(validation);

		// 両方とも有効な場合のみ親に通知
		if (validation.isValid && longitudeValidation.isValid) {
			const lat = newValue.trim() ? Number(newValue) : null;
			const lng = longitudeInput.trim() ? Number(longitudeInput) : null;

			if (lat !== null && lng !== null) {
				onChange({ latitude: lat, longitude: lng });
			} else {
				onChange(null);
			}
		}
	};

	/**
	 * 経度入力変更ハンドラー
	 */
	const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setLongitudeInput(newValue);

		// バリデーション
		const validation = validateLongitude(newValue);
		setLongitudeValidation(validation);

		// 両方とも有効な場合のみ親に通知
		if (validation.isValid && latitudeValidation.isValid) {
			const lat = latitudeInput.trim() ? Number(latitudeInput) : null;
			const lng = newValue.trim() ? Number(newValue) : null;

			if (lat !== null && lng !== null) {
				onChange({ latitude: lat, longitude: lng });
			} else {
				onChange(null);
			}
		}
	};

	return (
		<div className={className}>
			<div className="grid grid-cols-2 gap-4">
				{/* 緯度入力 */}
				<div className="space-y-2">
					<Label htmlFor="latitude">{latitudeLabel}</Label>
					<Input
						id="latitude"
						type="text"
						value={latitudeInput}
						onChange={handleLatitudeChange}
						placeholder="例: 35.6762"
						aria-invalid={!latitudeValidation.isValid}
						aria-describedby={
							latitudeValidation.errorMessage ? "latitude-error" : undefined
						}
					/>
					{latitudeValidation.errorMessage && (
						<p
							id="latitude-error"
							className="text-sm text-destructive"
							role="alert"
						>
							{latitudeValidation.errorMessage}
						</p>
					)}
				</div>

				{/* 経度入力 */}
				<div className="space-y-2">
					<Label htmlFor="longitude">{longitudeLabel}</Label>
					<Input
						id="longitude"
						type="text"
						value={longitudeInput}
						onChange={handleLongitudeChange}
						placeholder="例: 139.6503"
						aria-invalid={!longitudeValidation.isValid}
						aria-describedby={
							longitudeValidation.errorMessage ? "longitude-error" : undefined
						}
					/>
					{longitudeValidation.errorMessage && (
						<p
							id="longitude-error"
							className="text-sm text-destructive"
							role="alert"
						>
							{longitudeValidation.errorMessage}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
