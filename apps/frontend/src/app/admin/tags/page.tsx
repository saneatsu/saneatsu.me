"use client";

import { TagsTable } from "@/features/tag-management";

/**
 * 管理画面のタグ一覧ページ
 */
export default function TagsPage() {
	return (
		<div className="space-y-6">
			{/* タグ一覧テーブル */}
			<TagsTable />
		</div>
	);
}
