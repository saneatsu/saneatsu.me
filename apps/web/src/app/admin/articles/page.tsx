"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../shared/ui/button/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../shared/ui/card/card";
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
					<h2 className="text-3xl font-bold text-foreground">記事管理</h2>
					<p className="text-muted-foreground">
						記事の作成・編集・削除・公開状態の管理ができます
					</p>
				</div>
				<Button className="w-fit">
					<Plus className="mr-2 h-4 w-4" />
					新しい記事を作成
				</Button>
			</div>

			{/* 記事一覧カード */}
			<Card>
				<CardHeader>
					<CardTitle>記事一覧</CardTitle>
					<CardDescription>
						すべての記事が表示されます。ステータスや言語でフィルタリングできます。
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ArticlesTable key={refreshKey} onRefresh={handleRefresh} />
				</CardContent>
			</Card>
		</div>
	);
}
