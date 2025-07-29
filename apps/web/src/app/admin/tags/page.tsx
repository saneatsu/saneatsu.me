"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../shared/ui/button/button";
import { TagsTable } from "./components/tags-table";

/**
 * 管理画面のタグ一覧ページ
 */
export default function TagsPage() {
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
					<h2 className="text-2xl font-bold text-foreground">タグ管理</h2>
					<p className="text-muted-foreground">
						記事に使用するタグの作成・編集・削除ができます
					</p>
				</div>
				<Link href="/admin/tags/new">
					<Button className="w-fit">
						<Plus className="mr-2 h-4 w-4" />
						新しいタグを作成
					</Button>
				</Link>
			</div>

			{/* タグ一覧テーブル */}
			<TagsTable key={refreshKey} onRefresh={handleRefresh} />
		</div>
	);
}
