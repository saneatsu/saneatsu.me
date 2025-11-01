"use client";

import { Check, PlusCircle, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { parseAsInteger } from "nuqs";
import { useCallback, useMemo, useState } from "react";

import { useGetAllTags } from "@/entities/tag";
import { cn, usePersistentQueryStates } from "@/shared/lib";
import {
	Badge,
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Separator,
} from "@/shared/ui";

import { parseAsCommaSeparatedNumbers } from "../../lib/parse-as-comma-separated-numbers";

/**
 * タグフィルターオプションの定義
 */
interface TagFilterOption {
	/** 表示ラベル */
	label: string;
	/** フィルター値（タグID） */
	value: string;
	/** 記事数 */
	count: number;
}

/**
 * ブログページ用タグフィルターコンポーネント
 *
 * @description
 * ブログページで記事をタグでフィルタリングするためのコンポーネント。
 * DataTableFacetedFilterと同じUIを持つが、URL状態管理を直接行う。
 *
 * 機能:
 * - タグの複数選択/解除
 * - 検索機能
 * - 選択中のタグを表示
 * - すべてクリア
 * - articleCount > 0のタグのみ表示
 * - URL状態をlocalStorageに永続化
 *
 * @example
 * ```tsx
 * <TagFilter />
 * ```
 */
export function TagFilter() {
	const [open, setOpen] = useState(false);
	const locale = useLocale();
	const t = useTranslations("blog.tagFilter");

	// URL状態からtagIdsとpageを読み取り・更新
	const [{ tagIds }, setQuery] = usePersistentQueryStates(
		"articles-list-filters",
		{
			page: parseAsInteger.withDefault(1),
			tagIds: parseAsCommaSeparatedNumbers,
		},
		{
			scroll: false,
			history: "push",
		}
	);

	// タグ一覧を取得（公開記事のみのカウント）
	const { data: tagsData, isLoading } = useGetAllTags({ status: "published" });

	// タグオプションを生成（articleCount > 0のみ）
	const tagOptions: TagFilterOption[] = useMemo(() => {
		if (!tagsData?.data) return [];

		return tagsData.data
			.filter((tag) => tag.articleCount > 0)
			.map((tag) => ({
				label:
					tag.translations[locale as "ja" | "en"] ||
					tag.translations.ja ||
					tag.slug,
				value: tag.id.toString(),
				count: tag.articleCount,
			}));
	}, [tagsData, locale]);

	// 選択中のタグID
	const selectedValues = new Set(tagIds.map(String));

	/**
	 * タグ選択時のコールバック
	 *
	 * @description
	 * 1. 選択されている場合: 選択を解除
	 * 2. 選択されていない場合: 選択を追加
	 * 3. URL状態を更新（pageも1にリセット）
	 */
	const onItemSelect = useCallback(
		(option: TagFilterOption, isSelected: boolean) => {
			const newSelectedValues = new Set(selectedValues);
			if (isSelected) {
				newSelectedValues.delete(option.value);
			} else {
				newSelectedValues.add(option.value);
			}

			const filterValues = Array.from(newSelectedValues).map((v) =>
				Number.parseInt(v, 10)
			);
			setQuery({
				tagIds: filterValues.length > 0 ? filterValues : [],
				page: 1,
			});
		},
		[selectedValues, setQuery]
	);

	/**
	 * フィルターリセット時のコールバック
	 *
	 * @description
	 * イベント伝播を停止して、親要素のクリックイベントを防ぐ
	 * pageも1にリセット
	 */
	const onReset = useCallback(
		(event?: React.MouseEvent) => {
			event?.stopPropagation();
			setQuery({ tagIds: [], page: 1 });
		},
		[setQuery]
	);

	// ローディング中またはタグがない場合は表示しない
	if (isLoading || tagOptions.length === 0) {
		return null;
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="h-9 border-dashed">
					{selectedValues?.size > 0 ? (
						// biome-ignore lint/a11y/useSemanticElements: PopoverTrigger内のカスタムクリアボタンコンポーネント
						<div
							role="button"
							aria-label={t("clearLabel")}
							tabIndex={0}
							onClick={onReset}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onReset();
								}
							}}
							className="mr-2 h-4 w-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<XCircle className="h-4 w-4" />
						</div>
					) : (
						<PlusCircle className="mr-2 h-4 w-4" />
					)}
					{t("title")}
					{selectedValues?.size > 0 && (
						<>
							<Separator orientation="vertical" className="mx-2 h-4" />
							<Badge
								variant="secondary"
								className="rounded-sm px-1 font-normal lg:hidden"
							>
								{selectedValues.size}
							</Badge>
							<div className="hidden space-x-1 lg:flex">
								{selectedValues.size > 2 ? (
									<Badge
										variant="secondary"
										className="rounded-sm px-1 font-normal"
									>
										{selectedValues.size} {t("selected")}
									</Badge>
								) : (
									tagOptions
										.filter((option) => selectedValues.has(option.value))
										.map((option) => (
											<Badge
												variant="secondary"
												key={option.value}
												className="rounded-sm px-1 font-normal"
											>
												{option.label}
											</Badge>
										))
								)}
							</div>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0" align="start">
				<Command>
					<CommandInput placeholder={t("placeholder")} />
					<CommandList>
						<CommandEmpty>{t("noResults")}</CommandEmpty>
						<CommandGroup>
							{tagOptions.map((option) => {
								const isSelected = selectedValues.has(option.value);
								return (
									<CommandItem
										key={option.value}
										onSelect={() => onItemSelect(option, isSelected)}
										className="cursor-pointer"
									>
										<div
											className={cn(
												"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												isSelected
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible"
											)}
										>
											<Check className={cn("h-4 w-4")} />
										</div>
										<span className="truncate">{option.label}</span>
										{option.count !== undefined && (
											<span className="ml-auto font-mono text-xs">
												{option.count}
											</span>
										)}
									</CommandItem>
								);
							})}
						</CommandGroup>
						{selectedValues.size > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem
										onSelect={() => onReset()}
										className="cursor-pointer justify-center text-center"
									>
										{t("clear")}
									</CommandItem>
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
