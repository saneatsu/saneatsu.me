"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, type Coordinates, Input } from "@/shared/ui";
import { useSearchGeocoding } from "../../api/use-search-geocoding/use-search-geocoding";

/**
 * 住所検索コンポーネントのプロパティ
 */
export interface AddressSearchProps {
	/** 住所選択時のコールバック */
	onSelect: (coordinates: Coordinates, address: string) => void;
	/** 検索言語（デフォルト: ja）*/
	language?: "ja" | "en";
	/** 検索結果の最大数（デフォルト: 5）*/
	limit?: number;
	/** プレースホルダーテキスト */
	placeholder?: string;
	/** クラス名 */
	className?: string;
}

/**
 * 住所検索コンポーネント
 *
 * @description
 * Mapbox Geocoding APIを使用して住所から座標を検索する。
 * 検索結果をリスト表示し、選択すると座標を親コンポーネントに返す。
 *
 * @example
 * ```tsx
 * <AddressSearch
 *   onSelect={(coordinates, address) => {
 *     console.log('Selected:', address, coordinates);
 *   }}
 *   language="ja"
 *   limit={5}
 *   placeholder="住所を入力してください"
 * />
 * ```
 */
export function AddressSearch({
	onSelect,
	language = "ja",
	limit = 5,
	placeholder = "住所を入力してください",
	className,
}: AddressSearchProps) {
	// 検索クエリの状態
	const [searchQuery, setSearchQuery] = useState("");
	// 実際に検索を実行するクエリ（Enterまたは検索ボタンで更新）
	const [executeQuery, setExecuteQuery] = useState("");

	// ジオコーディング検索
	const { data, isLoading, error } = useSearchGeocoding({
		q: executeQuery,
		language,
		limit,
		enabled: executeQuery.length > 0,
	});

	/**
	 * テキスト削除時の自動再検索
	 *
	 * @description
	 * ユーザーがテキストを削除した場合、自動的に新しい検索クエリで再検索する。
	 * これにより、古い検索結果が表示され続けるのを防ぐ。
	 */
	useEffect(() => {
		// テキストが削除された（短くなった）場合
		if (searchQuery.length < executeQuery.length) {
			if (searchQuery.trim()) {
				// 空でない場合は自動的に再検索
				setExecuteQuery(searchQuery.trim());
			} else {
				// 空になった場合は検索結果をクリア
				setExecuteQuery("");
			}
		}
	}, [searchQuery, executeQuery]);

	/**
	 * 検索実行ハンドラー
	 */
	const handleSearch = () => {
		if (searchQuery.trim()) {
			setExecuteQuery(searchQuery.trim());
		}
	};

	/**
	 * Enterキー押下ハンドラー
	 */
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	/**
	 * 検索結果選択ハンドラー
	 */
	const handleSelectResult = (
		coordinates: Coordinates,
		fullAddress: string
	) => {
		onSelect(coordinates, fullAddress);
		// 選択した住所を入力フィールドに表示
		setSearchQuery(fullAddress);
		// 検索結果リストを非表示にする
		setExecuteQuery("");
	};

	return (
		<div className={className}>
			{/* 検索フィールド */}
			<div className="flex gap-2">
				<div className="relative flex-1">
					{/* ローディングアイコン */}
					{isLoading && (
						<div className="absolute left-3 top-1/2 -translate-y-1/2">
							<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						</div>
					)}
					<Input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						className={isLoading ? "pl-10" : ""}
					/>
				</div>
				<Button
					type="button"
					onClick={handleSearch}
					disabled={isLoading || !searchQuery.trim()}
				>
					<Search className="h-4 w-4" />
				</Button>
			</div>

			{/* エラー状態 */}
			{error && (
				<div className="mt-2 text-sm text-destructive">
					{error.message || "住所の検索に失敗しました"}
				</div>
			)}

			{/* 検索結果リスト */}
			{data && data.features.length > 0 && (
				<ul className="mt-2 space-y-1 border rounded-md p-2 bg-card">
					{data.features.map((feature, index) => (
						<li
							key={`${feature.coordinates.latitude}-${feature.coordinates.longitude}-${index}`}
						>
							<button
								type="button"
								onClick={() =>
									handleSelectResult(feature.coordinates, feature.fullAddress)
								}
								className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
							>
								<div className="font-medium">{feature.name}</div>
								<div className="text-sm text-muted-foreground">
									{feature.fullAddress}
								</div>
							</button>
						</li>
					))}
				</ul>
			)}

			{/* 検索結果が0件の場合 */}
			{data && data.features.length === 0 && executeQuery && (
				<div className="mt-2 text-sm text-muted-foreground">
					検索結果が見つかりませんでした
				</div>
			)}
		</div>
	);
}
