"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/shared/ui/button/button";

import { ArticlesTable } from "./components/articles-table";

/**
 * 管理画面の記事一覧ページ
 */
export default function ArticlesPage() {
	const [refreshKey, setRefreshKey] = useState(0);

	/**
	 * テーブルの再読み込み
	 */
	const handleRefresh = () => {
		setRefreshKey((prev) => prev + 1);
	};

	return (
		<div className="space-y-6">
			{/* ヘッダー */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
				<div>
					<h2 className="text-2xl font-bold text-foreground">記事管理</h2>
					<p className="text-muted-foreground">
						記事の作成・編集・削除・公開状態の管理ができます
					</p>
				</div>
				<Link href="/admin/articles/new">
					<Button className="w-fit">
						<Plus className="mr-2 h-4 w-4" />
						新しい記事を作成
					</Button>
				</Link>
			</div>

			{/* 記事一覧テーブル */}
			<ArticlesTable key={refreshKey} onRefresh={handleRefresh} />
		</div>
	);
}
