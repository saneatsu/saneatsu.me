import { auth } from "../../shared/lib/auth";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../shared/ui/card/card";

export default async function AdminDashboard() {
	const session = await auth();

	return (
		<div>
			<h2 className="text-3xl font-bold text-foreground mb-6">
				ダッシュボード
			</h2>
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>ようこそ、{session?.user?.name || "管理者"}さん</CardTitle>
					<CardDescription>
						ここから記事やタグの管理ができます。左のメニューから選択してください。
					</CardDescription>
				</CardHeader>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">記事数</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-primary">-</p>
						<p className="text-sm text-muted-foreground mt-2">公開済み記事</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">下書き記事</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-yellow-600">-</p>
						<p className="text-sm text-muted-foreground mt-2">未公開の記事</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">タグ数</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-green-600">-</p>
						<p className="text-sm text-muted-foreground mt-2">登録済みタグ</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
