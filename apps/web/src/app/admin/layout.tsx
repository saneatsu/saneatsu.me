import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "../../shared/lib/auth";

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
		<div className="min-h-screen bg-gray-50">
			<div className="flex h-screen">
				{/* サイドバー */}
				<aside className="w-64 bg-white shadow-md">
					<div className="p-6">
						<h1 className="text-2xl font-bold text-gray-800">管理画面</h1>
					</div>
					<nav className="mt-6">
						<a
							href="/admin"
							className="block px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
						>
							ダッシュボード
						</a>
						<a
							href="/admin/articles"
							className="block px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
						>
							記事管理
						</a>
						<a
							href="/admin/tags"
							className="block px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
						>
							タグ管理
						</a>
					</nav>
					<div className="absolute bottom-0 w-64 p-6 border-t">
						<div className="flex items-center space-x-3">
							{session.user?.image && (
								<Image
									src={session.user.image}
									alt={session.user.name || ""}
									width={40}
									height={40}
									className="w-10 h-10 rounded-full"
								/>
							)}
							<div>
								<p className="text-sm font-medium text-gray-700">
									{session.user?.name}
								</p>
								<p className="text-xs text-gray-500">{session.user?.email}</p>
							</div>
						</div>
						<a
							href="/api/auth/signout"
							className="mt-4 block w-full text-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
						>
							ログアウト
						</a>
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
