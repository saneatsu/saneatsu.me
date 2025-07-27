"use client";

import { FileText, Home, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "../../../shared/ui/sidebar/sidebar";
import { UserInfo } from "../user-info";

/**
 * 管理画面用のメニュー項目定義
 */
const menuItems = [
	{
		title: "ダッシュボード",
		url: "/admin",
		icon: Home,
	},
	{
		title: "記事管理",
		url: "/admin/articles",
		icon: FileText,
	},
	{
		title: "タグ管理",
		url: "/admin/tags",
		icon: Tag,
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
 */
export function AppSidebar({ user }: AppSidebarProps) {
	const pathname = usePathname();

	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>管理画面</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild isActive={pathname === item.url}>
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
