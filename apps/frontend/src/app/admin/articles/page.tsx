"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ArticlesTable } from "@/features/article-management";
import { Button } from "@/shared/ui/button/button";

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
			{/* 新規作成ボタン */}
			<div className="flex justify-end">
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
