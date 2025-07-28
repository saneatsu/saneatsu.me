"use client";

import { useState } from "react";
import { useGetAllTags } from "../../../../entities/tag";
import { Badge } from "../../../../shared/ui/badge/badge";
import {
	DataTable,
	type DataTableColumn,
	type DataTablePagination,
	type DataTableSort,
} from "../../../../shared/ui/data-table/data-table";
import { TagActions } from "./tag-actions";

/**
 * タグ一覧テーブルコンポーネントのプロパティ
 */
interface TagsTableProps {
	/** テーブル再読み込み用のコールバック */
	onRefresh?: () => void;
}

/**
 * タグ一覧テーブルコンポーネント
 */
export function TagsTable({ onRefresh }: TagsTableProps) {
	// ページネーション状態の管理
	const [pagination, setPagination] = useState<DataTablePagination>({
		page: 1,
		limit: 50,
		total: 0,
		totalPages: 0,
	});

	// ソート状態の管理
	const [sort, setSort] = useState<DataTableSort>({
		key: "name",
		direction: "asc",
	});

	// タグ一覧を取得
	const {
		data: tagsResponse,
		isLoading,
		error,
	} = useGetAllTags({
		lang: "ja", // 管理画面では日本語固定
	});

	/**
	 * ページ変更時の処理
	 */
	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }));
	};

	/**
	 * ページサイズ変更時の処理
	 */
	const handlePageSizeChange = (limit: number) => {
		setPagination((prev) => ({ ...prev, limit, page: 1 }));
	};

	/**
	 * ソート変更時の処理
	 */
	const handleSortChange = (newSort: DataTableSort) => {
		setSort(newSort);
		// 実際の実装では、バックエンドでソートする必要がある
	};

	/**
	 * タグアクション実行後の処理
	 */
	const handleTagAction = () => {
		onRefresh?.();
	};

	/**
	 * テーブルカラムの定義
	 */
	const columns: DataTableColumn<{
		id: number;
		slug: string;
		name: string | null;
		articleCount: number;
	}>[] = [
		{
			key: "slug",
			label: "スラッグ",
			sortable: true,
			className: "w-[200px]",
			render: (tag) => (
				<div className="font-mono text-sm">{tag.slug}</div>
			),
		},
		{
			key: "name",
			label: "タグ名",
			sortable: true,
			className: "min-w-[200px]",
			render: (tag) => (
				<div className="space-y-1">
					<div className="font-medium">
						{tag.name || <span className="text-muted-foreground">未設定</span>}
					</div>
				</div>
			),
		},
		{
			key: "articleCount",
			label: "記事数",
			sortable: true,
			className: "w-[120px]",
			render: (tag) => (
				<Badge variant="secondary" className="min-w-[3rem] justify-center">
					{tag.articleCount}
				</Badge>
			),
		},
		{
			key: "actions",
			label: "アクション",
			className: "w-[120px]",
			render: (tag) => (
				<TagActions tag={tag} onAction={handleTagAction} />
			),
		},
	];

	// データの準備（ページネーション処理）
	const tags = tagsResponse?.data || [];
	const paginatedTags = tags.slice(
		(pagination.page - 1) * pagination.limit,
		pagination.page * pagination.limit
	);

	// ページネーション情報の更新
	const updatedPagination: DataTablePagination = {
		...pagination,
		total: tags.length,
		totalPages: Math.ceil(tags.length / pagination.limit),
	};

	return (
		<DataTable
			data={paginatedTags}
			columns={columns}
			pagination={updatedPagination}
			onPageChange={handlePageChange}
			onPageSizeChange={handlePageSizeChange}
			pageSizeOptions={[50, 100, 150]}
			sort={sort}
			onSortChange={handleSortChange}
			loading={isLoading}
			error={error?.message}
			emptyMessage="タグが見つかりません"
		/>
	);
}