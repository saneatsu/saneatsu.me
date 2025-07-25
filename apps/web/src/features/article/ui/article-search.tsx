"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export interface ArticleSearchProps {
	/** 検索実行時のコールバック */
	onSearch: (query: string) => void;
	/** 初期検索クエリ */
	initialQuery?: string;
	/** プレースホルダーテキスト */
	placeholder?: string;
	/** 検索中かどうか */
	isLoading?: boolean;
}

/**
 * 記事検索コンポーネント
 *
 * @description
 * 記事を検索するためのフォームコンポーネント。
 * リアルタイム検索とボタンクリック検索の両方に対応。
 */
export function ArticleSearch({
	onSearch,
	initialQuery = "",
	placeholder,
	isLoading = false,
}: ArticleSearchProps) {
	const t = useTranslations("common");
	const [query, setQuery] = useState(initialQuery);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSearch(query.trim());
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setQuery(value);
		// リアルタイム検索（500ms後に実行）
		// TODO: デバウンス機能を追加
	};

	return (
		<form onSubmit={handleSubmit} className="w-full max-w-md">
			<div className="relative">
				<input
					type="text"
					value={query}
					onChange={handleInputChange}
					placeholder={placeholder || t("search")}
					disabled={isLoading}
					className="w-full px-4 py-2 pl-10 pr-12 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
				/>

				{/* 検索アイコン */}
				<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>

				{/* 検索ボタン */}
				<button
					type="submit"
					disabled={isLoading}
					className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50"
				>
					{isLoading ? "..." : t("search")}
				</button>
			</div>
		</form>
	);
}
