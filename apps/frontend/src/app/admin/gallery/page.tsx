"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { GalleryTable } from "@/features/gallery-management";
import { Button } from "@/shared/ui";

/**
 * 管理画面のギャラリー一覧ページ
 *
 * @description
 * ギャラリー画像の一覧を表示し、新規画像の追加、
 * 既存画像の編集・削除を行うページ。
 */
export default function GalleryPage() {
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
				<Link href="/admin/gallery/new">
					<Button className="w-fit">
						<Plus className="h-4 w-4" />
						追加
					</Button>
				</Link>
			</div>

			{/* ギャラリー画像一覧テーブル */}
			<GalleryTable key={refreshKey} onRefresh={handleRefresh} />
		</div>
	);
}
