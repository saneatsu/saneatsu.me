"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ArticleFilters } from "../../../../shared/types/article";
import { ARTICLE_STATUS_CONFIG } from "../../../../shared/types/article";
import { Badge } from "../../../../shared/ui/badge/badge";
import { Button } from "../../../../shared/ui/button/button";
import { Input } from "../../../../shared/ui/input/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../shared/ui/select/select";

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
	const inputRef = useRef<HTMLInputElement>(null);

	// filtersのsearchが外部から変更された場合（リセットなど）にローカル状態を同期
	useEffect(() => {
		setSearchValue(filters.search);
	}, [filters.search]);

	/**
	 * Enterキーで検索を実行
	 */
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault(); // フォームのデフォルト動作を防ぐ

			// 検索を実行
			onFiltersChange({
				...filters,
				search: searchValue,
			});

			// URL更新後にフォーカスを復元（遅延実行）
			setTimeout(() => {
				if (inputRef.current) {
					inputRef.current.focus();
				}
			}, 0);
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
					<Select
						value={filters.status}
						onValueChange={(value) => updateFilter("status", value)}
						disabled={loading}
					>
						<SelectTrigger id="status-filter">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">全て</SelectItem>
							<SelectItem value="draft">
								{ARTICLE_STATUS_CONFIG.draft.label}
							</SelectItem>
							<SelectItem value="published">
								{ARTICLE_STATUS_CONFIG.published.label}
							</SelectItem>
							<SelectItem value="archived">
								{ARTICLE_STATUS_CONFIG.archived.label}
							</SelectItem>
						</SelectContent>
					</Select>
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
							placeholder="日本語記事のタイトル・内容で検索（Enterキーで実行）"
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
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
