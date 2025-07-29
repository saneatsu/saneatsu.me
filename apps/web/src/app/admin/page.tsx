import { DashboardMain } from "../../features/dashboard/ui/main";
import { auth } from "../../shared/lib/auth";

/**
 * 管理者ダッシュボードページ
 *
 * @description
 * 管理者用のダッシュボードページ。記事・タグの統計情報、
 * 人気コンテンツ、最近の活動などを表示する。
 */
export default async function AdminDashboard() {
	const session = await auth();

	return <DashboardMain userName={session?.user?.name || undefined} />;
}
