"use client";

import { Edit, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import type { Tag } from "@/shared/model";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui";

/**
 * TagActionsコンポーネントのProps
 */
interface TagActionsProps {
	/** 操作対象のタグ */
	tag: Tag;
}

/**
 * タグアクションドロップダウンメニュー
 *
 * @description
 * タグテーブルの各行に表示されるアクションメニュー。
 * 現在は編集アクションのみを提供。
 *
 * アクション:
 * - 編集: タグ編集ページへ遷移
 */
export function TagActions({ tag }: TagActionsProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">アクションメニューを開く</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{/* 編集アクション */}
				<DropdownMenuItem asChild>
					<Link href={`/admin/tags/${tag.id}/edit`}>
						<Edit className="mr-2 h-4 w-4" />
						編集
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
