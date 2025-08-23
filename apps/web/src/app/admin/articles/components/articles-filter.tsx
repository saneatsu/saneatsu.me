"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ArticleFilters } from "../../../../shared/types/article";
import { ARTICLE_STATUS_CONFIG } from "../../../../shared/types/article";
import { Badge } from "../../../../shared/ui/badge/badge";
import { Button } from "../../../../shared/ui/button/button";
import { Input } from "../../../../shared/ui/input/input";

/**
 * 記事フィルターコンポーネントのプロパティ
 */
interface ArticlesFilterProps {
	/** 現在のフィルター値 */
	filters: ArticleFilters;
	/** フィルター変更時のコールバック */
	onFiltersChange: (filters: ArticleFilters) => void;
	/** ローディング状態 */
	loading?: boolean;
}

/**
 * 記事一覧のフィルター・検索コンポーネント
 * ステータス、検索キーワードでの絞り込み機能を提供
 */
export function ArticlesFilter({
	filters,
	onFiltersChange,
	loading = false,
}: ArticlesFilterProps) {
	// 検索入力のローカル状態（即座にUIを更新するため）
	const [searchValue, setSearchValue] = useState(filters.search);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [isEnterPressed, setIsEnterPressed] = useState(false);

	// filtersのsearchが外部から変更された場合（リセットなど）にローカル状態を同期
	useEffect(() => {
		setSearchValue(filters.search);
	}, [filters.search]);

	// 検索実行後にフォーカスを復元
	useEffect(() => {
		if (isEnterPressed && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isEnterPressed]); // Enterキーが押された時にフォーカスを復元

	// 検索入力のdebounce処理
	useEffect(() => {
		// Enterキーが押された直後はdebounceをスキップ
		if (isEnterPressed) {
			return;
		}

		// 既存のタイマーをクリア
		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}

		timerRef.current = setTimeout(() => {
			// 値が実際に変更された場合のみ通知
			if (searchValue !== filters.search) {
				onFiltersChange({
					...filters,
					search: searchValue,
				});
			}
		}, 500); // 500msのdebounce

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [searchValue, filters, onFiltersChange, isEnterPressed]);

	/**
	 * Enterキーで即座に検索を実行
	 */
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault(); // フォームのデフォルト動作を防ぐ

			// debounceタイマーをクリア
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}

			// Enterキーが押されたことを記録
			setIsEnterPressed(true);

			// 即座に検索を実行
			onFiltersChange({
				...filters,
				search: searchValue,
			});

			// 少し後にフラグをリセット（次の入力でdebounceを再開するため）
			setTimeout(() => {
				setIsEnterPressed(false);
			}, 100);
		}
	};

	/**
	 * フィルター値更新
	 */
	const updateFilter = (key: keyof ArticleFilters, value: string) => {
		onFiltersChange({
			...filters,
			[key]: value,
		});
	};

	/**
	 * フィルターリセット
	 */
	const resetFilters = () => {
		setSearchValue(""); // ローカル状態もリセット
		onFiltersChange({
			status: "all",
			language: "ja", // 日本語固定
			search: "",
		});
	};

	/**
	 * アクティブなフィルター数を取得
	 */
	const getActiveFilterCount = (): number => {
		let count = 0;
		if (filters.status !== "all") count++;
		if (filters.search.trim() !== "") count++;
		return count;
	};

	const activeFilterCount = getActiveFilterCount();

	return (
		<div className="space-y-4 rounded-lg border bg-card p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-medium">フィルター</h3>
					{activeFilterCount > 0 && (
						<Badge variant="secondary" className="text-xs">
							{activeFilterCount}個適用中
						</Badge>
					)}
				</div>
				{activeFilterCount > 0 && (
					<Button
						variant="outline"
						size="sm"
						onClick={resetFilters}
						disabled={loading}
					>
						リセット
					</Button>
				)}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{/* ステータスフィルター */}
				<div className="space-y-2">
					<label
						htmlFor="status-filter"
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						ステータス
					</label>
					<select
						id="status-filter"
						value={filters.status}
						onChange={(e) => updateFilter("status", e.target.value)}
						disabled={loading}
						className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="all">全て</option>
						<option value="draft">{ARTICLE_STATUS_CONFIG.draft.label}</option>
						<option value="published">
							{ARTICLE_STATUS_CONFIG.published.label}
						</option>
						<option value="archived">
							{ARTICLE_STATUS_CONFIG.archived.label}
						</option>
					</select>
				</div>

				{/* 検索フィルター */}
				<div className="space-y-2">
					<label
						htmlFor="search-filter"
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						検索
					</label>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							ref={inputRef}
							id="search-filter"
							type="text"
							placeholder="日本語記事のタイトル・内容で検索..."
							value={searchValue}
							onChange={(e) => {
								setSearchValue(e.target.value);
								// 新たな入力があったらEnterフラグをリセット
								if (isEnterPressed) {
									setIsEnterPressed(false);
								}
							}}
							onKeyDown={handleKeyDown}
							disabled={loading}
							className="pl-10"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
