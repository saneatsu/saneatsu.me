"use client";

import { useTranslations } from "next-intl";
import type { Tag } from "../../../shared";

export interface ArticleFilterProps {
	/** 利用可能なタグのリスト */
	tags: Tag[];
	/** 選択されたタグのID */
	selectedTagId?: number;
	/** タグ選択時のコールバック */
	onTagSelect: (tagId: number | undefined) => void;
	/** 選択されたステータス */
	selectedStatus?: "all" | "published" | "draft";
	/** ステータス選択時のコールバック */
	onStatusSelect: (status: "all" | "published" | "draft") => void;
}

/**
 * 記事フィルタリングコンポーネント
 *
 * @description
 * 記事をタグやステータスでフィルタリングするためのコンポーネント。
 * タグセレクターとステータスセレクターを含む。
 */
export function ArticleFilter({
	tags,
	selectedTagId,
	onTagSelect,
	selectedStatus = "all",
	onStatusSelect,
}: ArticleFilterProps) {
	const t = useTranslations("common");

	return (
		<div className="flex flex-col sm:flex-row gap-4">
			{/* タグフィルター */}
			<div className="flex flex-col gap-2">
				<label
					htmlFor="tag-filter"
					className="text-sm font-medium text-foreground"
				>
					{t("filterByTag")}
				</label>
				<select
					id="tag-filter"
					value={selectedTagId || ""}
					onChange={(e) => {
						const value = e.target.value;
						onTagSelect(value ? Number(value) : undefined);
					}}
					className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
				>
					<option value="">{t("allTags")}</option>
					{tags.map((tag) => (
						<option key={tag.id} value={tag.id}>
							{tag.name}
						</option>
					))}
				</select>
			</div>

			{/* ステータスフィルター */}
			<div className="flex flex-col gap-2">
				<label
					htmlFor="status-filter"
					className="text-sm font-medium text-foreground"
				>
					{t("filterByStatus")}
				</label>
				<select
					id="status-filter"
					value={selectedStatus}
					onChange={(e) => {
						onStatusSelect(e.target.value as "all" | "published" | "draft");
					}}
					className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
				>
					<option value="all">{t("allStatus")}</option>
					<option value="published">{t("published")}</option>
					<option value="draft">{t("draft")}</option>
				</select>
			</div>

			{/* フィルタークリアボタン */}
			{(selectedTagId || selectedStatus !== "all") && (
				<div className="flex flex-col justify-end">
					<button
						type="button"
						onClick={() => {
							onTagSelect(undefined);
							onStatusSelect("all");
						}}
						className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-input rounded-md hover:bg-accent"
					>
						{t("clearFilters")}
					</button>
				</div>
			)}
		</div>
	);
}
