"use client";

import { Edit, MoreHorizontal, Trash } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../../shared/ui/button/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../../../shared/ui/dropdown-menu/dropdown-menu";

/**
 * タグアクションのプロパティ
 */
interface TagActionsProps {
	/** タグ情報 */
	tag: {
		id: number;
		slug: string;
		name: string | null;
		articleCount: number;
	};
	/** アクション実行後のコールバック */
	onAction?: () => void;
}

/**
 * タグアクションメニューコンポーネント
 */
export function TagActions({ tag, onAction }: TagActionsProps) {
	const [isOpen, setIsOpen] = useState(false);

	/**
	 * 削除処理（将来実装予定）
	 */
	const handleDelete = async () => {
		// TODO: 削除確認ダイアログを表示
		// TODO: 削除APIを呼び出し
		console.log("Delete tag:", tag.id);
		onAction?.();
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="h-8 w-8 p-0"
					aria-label="アクションメニューを開く"
				>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>アクション</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link
						href={`/admin/tags/${tag.id}/edit`}
						className="flex cursor-pointer items-center"
					>
						<Edit className="mr-2 h-4 w-4" />
						編集
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={handleDelete}
					disabled={tag.articleCount > 0}
					className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
				>
					<Trash className="mr-2 h-4 w-4" />
					削除
					{tag.articleCount > 0 && (
						<span className="ml-auto text-xs text-muted-foreground">
							(使用中)
						</span>
					)}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}