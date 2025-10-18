import { redirect } from "next/navigation";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { AdminLayout } from "@/widgets/admin-layout";

/**
 * 管理画面共通レイアウト
 *
 * @description
 * AdminLayoutウィジェットを使用した管理画面専用のレイアウトコンポーネント。
 * 認証チェックを行い、未認証の場合はログインページにリダイレクトする。
 *
 * @remarks
 * Route Groups機能により、adminグループ内の全ページに自動適用される。
 */
export default async function AdminPagesLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();

	if (!session) {
		redirect("/login");
	}

	return <AdminLayout user={session?.user}>{children}</AdminLayout>;
}
