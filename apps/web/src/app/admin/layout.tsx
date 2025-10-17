import { redirect } from "next/navigation";

import { auth } from "@/shared/lib";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui";

import { AppSidebar } from "./components/app-sidebar";
import { BreadcrumbWrapper } from "./components/breadcrumb-wrapper";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session) {
		redirect("/login");
	}

	return (
		<SidebarProvider>
			<AppSidebar user={session?.user} />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<div className="h-4 w-px bg-border mx-2" />
					<BreadcrumbWrapper />
				</header>
				<div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
