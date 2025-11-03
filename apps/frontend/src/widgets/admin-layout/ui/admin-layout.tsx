"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui";

import { AppSidebar } from "./app-sidebar";
import { BreadcrumbWrapper } from "./breadcrumb-wrapper";

/**
 * AdminLayoutコンポーネントのProps型定義
 */
interface AdminLayoutProps {
	/** レイアウト内に表示する子要素 */
	children: React.ReactNode;
	/** ログインユーザー情報 */
	user:
		| {
				name?: string | null;
				email?: string | null;
				image?: string | null;
		  }
		| undefined;
}

/**
 * 管理画面用レイアウトコンポーネント
 *
 * @description
 * サイドバー、ヘッダー（パンくずリスト付き）、コンテンツエリアを持つ
 * 管理画面全体のレイアウトを提供する。
 *
 * @remarks
 * このコンポーネントはFeature-Sliced Designのwidgetsレイヤーに属し、
 * 管理画面のレイアウトロジックをカプセル化している。
 * Nito WorkspaceのWorkspaceLayoutの構造を採用している。
 */
export function AdminLayout({ children, user }: AdminLayoutProps) {
	return (
		<SidebarProvider>
			<AppSidebar user={user} />
			<SidebarInset>
				<div className="p-3 bg-sidebar min-h-screen">
					<div className="rounded-xl border bg-background text-card-foreground shadow-xs flex-1 flex flex-col">
						<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
							<SidebarTrigger className="-ml-1" />
							<div className="h-4 w-px bg-sidebar-border" />
							<BreadcrumbWrapper />
						</header>
						<main className="flex flex-1 flex-col p-6 min-h-[calc(100vh-5.5rem)]">
							{children}
						</main>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
