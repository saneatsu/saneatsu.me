"use client";

import { FileText, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/shared/ui/sidebar/sidebar";
import { UserInfo } from "@/widgets/user-info";

/**
 * 管理画面用のメニュー項目定義
 */
const menuItems = [
	{
		title: "ダッシュボード",
		url: "/admin",
		icon: LayoutDashboard,
	},
	{
		title: "記事管理",
		url: "/admin/articles",
		icon: FileText,
	},
];

interface AppSidebarProps {
	user:
		| {
				name?: string | null;
				email?: string | null;
				image?: string | null;
		  }
		| undefined;
}

/**
 * 管理画面のサイドバーコンポーネント
 *
 * @description
 * shadcn/ui Sidebarコンポーネントを使用した管理画面用サイドバー。
 * ナビゲーションメニューとユーザー情報を表示する。
 * Nito WorkspaceのAppSidebarの構造を採用している。
 *
 * ## 特徴
 * - shadcn/ui標準コンポーネントの活用
 * - レスポンシブ対応
 * - テーマ切り替え対応
 * - ユーザー情報表示
 */
export function AppSidebar({ user }: AppSidebarProps) {
	const pathname = usePathname();

	/**
	 * メニュー項目がアクティブかどうかを判定する
	 *
	 * @param itemUrl メニュー項目のURL
	 * @returns アクティブかどうか
	 */
	const getIsMenuActive = (itemUrl: string): boolean => {
		// 記事管理メニューの場合は /admin/articles/ で始まるパスもアクティブにする
		if (itemUrl === "/admin/articles") {
			return pathname === itemUrl || pathname.startsWith("/admin/articles/");
		}
		// その他のメニューは完全一致
		return pathname === itemUrl;
	};

	return (
		<Sidebar
			collapsible="icon"
			className="!border-r-0 [&>div[data-slot=sidebar-container]]:!border-r-0 [&_[data-sidebar=sidebar]]:!bg-sidebar pl-1"
		>
			<SidebarHeader>
				<div className="flex items-center py-2 h-18">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
						<FileText className="h-4 w-4 text-primary-foreground" />
					</div>
					<h2 className="ml-2 text-lg font-bold group-data-[collapsible=icon]:hidden">
						管理画面
					</h2>
				</div>
			</SidebarHeader>
			<SidebarContent className="flex-1">
				<SidebarGroup>
					{/* <SidebarGroupLabel>管理画面</SidebarGroupLabel> */}
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={getIsMenuActive(item.url)}
									>
										<Link href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<UserInfo user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}
