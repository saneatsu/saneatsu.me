import { auth } from "../../shared/lib/auth";

export default async function AdminDashboard() {
	const session = await auth();

	return (
		<div>
			<h2 className="text-3xl font-bold text-gray-800 mb-6">ダッシュボード</h2>
			<div className="bg-white rounded-lg shadow p-6">
				<p className="text-gray-600">
					ようこそ、{session?.user?.name || "管理者"}さん
				</p>
				<p className="mt-4 text-sm text-gray-500">
					ここから記事やタグの管理ができます。左のメニューから選択してください。
				</p>
			</div>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white rounded-lg shadow p-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-2">記事数</h3>
					<p className="text-3xl font-bold text-indigo-600">-</p>
					<p className="text-sm text-gray-500 mt-2">公開済み記事</p>
				</div>
				<div className="bg-white rounded-lg shadow p-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-2">
						下書き記事
					</h3>
					<p className="text-3xl font-bold text-yellow-600">-</p>
					<p className="text-sm text-gray-500 mt-2">未公開の記事</p>
				</div>
				<div className="bg-white rounded-lg shadow p-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-2">タグ数</h3>
					<p className="text-3xl font-bold text-green-600">-</p>
					<p className="text-sm text-gray-500 mt-2">登録済みタグ</p>
				</div>
			</div>
		</div>
	);
}