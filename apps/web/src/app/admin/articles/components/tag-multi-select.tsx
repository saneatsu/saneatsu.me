"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
import { useGetAllTags } from "../../../../entities/tag/api/use-get-all";
import type { Tag, TagOption } from "../../../../shared/types/tag";
import { Badge } from "../../../../shared/ui/badge/badge";
import { Button } from "../../../../shared/ui/button/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../../../../shared/ui/command/command";
import { Label } from "../../../../shared/ui/label/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../../../../shared/ui/popover/popover";

/**
 * タグ複数選択コンポーネントのプロパティ
 */
interface TagMultiSelectProps {
	/** 選択されたタグIDの配列 */
	value: number[];
	/** 値変更時のコールバック */
	onChange: (values: number[]) => void;
	/** エラー状態 */
	error?: string;
	/** 必須フィールドかどうか */
	required?: boolean;
}

/**
 * タグ複数選択コンポーネント
 *
 * @description
 * 既存のタグから複数選択できるコンポーネント。
 * Command + Popover を使用してタグ選択UIを提供し、
 * 選択されたタグはBadgeで表示される。
 */
export function TagMultiSelect({
	value,
	onChange,
	error,
	required = false,
}: TagMultiSelectProps) {
	const [open, setOpen] = useState(false);

	/**
	 * タグ一覧を取得
	 */
	const { data: tagsData, isLoading: loading, error: apiError } = useGetAllTags({
		lang: "ja",
	});

	const tags = tagsData?.data || [];

	/**
	 * タグオプションの配列を作成
	 */
	const tagOptions: TagOption[] = tags.map((tag) => ({
		value: tag.id.toString(),
		label: tag.name || "",
	}));

	/**
	 * 選択されたタグの配列を取得
	 */
	const selectedTags = tags.filter((tag) => value.includes(tag.id));

	/**
	 * タグ選択/選択解除の処理
	 */
	const handleSelect = (tagId: string) => {
		const id = Number(tagId);
		const isSelected = value.includes(id);

		if (isSelected) {
			// 選択解除
			onChange(value.filter((v) => v !== id));
		} else {
			// 選択追加
			onChange([...value, id]);
		}
	};

	/**
	 * タグを削除
	 */
	const handleRemove = (tagId: number) => {
		onChange(value.filter((v) => v !== tagId));
	};

	return (
		<div className="space-y-2">
			<Label className={required ? "required" : ""}>タグ</Label>

			{/* 選択されたタグの表示 */}
			{selectedTags.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{selectedTags.map((tag) => (
						<Badge key={tag.id} variant="secondary" className="pr-1">
							{tag.name}
							<button
								type="button"
								className="ml-1 rounded-full hover:bg-secondary-foreground/20"
								onClick={() => handleRemove(tag.id)}
							>
								<X className="h-3 w-3" />
								<span className="sr-only">削除</span>
							</button>
						</Badge>
					))}
				</div>
			)}

			{/* タグ選択用のPopover */}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
						disabled={loading}
					>
						{loading
							? "読み込み中..."
							: selectedTags.length > 0
								? `${selectedTags.length}個のタグが選択されています`
								: "タグを選択..."}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[400px] p-0">
					<Command>
						<CommandInput placeholder="タグを検索..." />
						<CommandList>
							<CommandEmpty>該当するタグが見つかりません。</CommandEmpty>
							<CommandGroup>
								{tagOptions.map((option) => (
									<CommandItem
										key={option.value}
										value={option.value}
										onSelect={handleSelect}
									>
										<Check
											className={`mr-2 h-4 w-4 ${
												value.includes(Number(option.value))
													? "opacity-100"
													: "opacity-0"
											}`}
										/>
										{option.label}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{/* エラーメッセージの表示 */}
			{(error || apiError) && (
				<p className="text-sm text-destructive">
					{error || (apiError instanceof Error ? apiError.message : "タグの取得に失敗しました")}
				</p>
			)}

			{/* ヘルプテキスト */}
			<p className="text-sm text-muted-foreground">
				記事に関連するタグを選択してください。最低1つのタグが必要です。
			</p>
		</div>
	);
}
