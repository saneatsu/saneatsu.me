import { redirect } from "next/navigation";
import { auth } from "../../shared/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "../../shared/ui/avatar/avatar";
import { Button } from "../../shared/ui/button/button";
import { Separator } from "../../shared/ui/separator/separator";

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
						<a
							href="/admin"
							className="block px-6 py-3 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
						>
							ダッシュボード
						</a>
						<a
							href="/admin/articles"
							className="block px-6 py-3 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
						>
							記事管理
						</a>
						<a
							href="/admin/tags"
							className="block px-6 py-3 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
						>
							タグ管理
						</a>
					</nav>
					<div className="absolute bottom-0 w-64 p-6">
						<Separator className="mb-6" />
						<div className="flex items-center space-x-3">
							<Avatar className="w-10 h-10">
								{session.user?.image && (
									<AvatarImage
										src={session.user.image}
										alt={session.user.name || ""}
									/>
								)}
								<AvatarFallback>
									{session.user?.name?.[0] || "U"}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="text-sm font-medium text-foreground">
									{session.user?.name}
								</p>
								<p className="text-xs text-muted-foreground">{session.user?.email}</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							className="mt-4 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
							asChild
						>
							<a href="/api/auth/signout">
								ログアウト
							</a>
						</Button>
					</div>
				</aside>

				{/* メインコンテンツ */}
				<main className="flex-1 overflow-y-auto">
					<div className="p-8">{children}</div>
				</main>
			</div>
		</div>
	);
}
