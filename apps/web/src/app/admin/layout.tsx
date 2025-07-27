import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../shared/lib/auth";
import { UserInfo } from "./user-info";

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
		<div className="min-h-screen bg-muted/40">
			<div className="flex h-screen">
				{/* サイドバー */}
				<aside className="w-64 bg-card border-r shadow-sm">
					<div className="p-6">
						<h1 className="text-2xl font-bold text-foreground">管理画面</h1>
					</div>
					<nav className="mt-6">
						<Link
							href="/admin"
							className="block px-6 py-3 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
						>
							ダッシュボード
						</Link>
						<Link
							href="/admin/articles"
							className="block px-6 py-3 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
						>
							記事管理
						</Link>
						<Link
							href="/admin/tags"
							className="block px-6 py-3 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
						>
							タグ管理
						</Link>
					</nav>
					<UserInfo user={session?.user} />
				</aside>

				{/* メインコンテンツ */}
				<main className="flex-1 overflow-y-auto">
					<div className="p-8">{children}</div>
				</main>
			</div>
		</div>
	);
}
