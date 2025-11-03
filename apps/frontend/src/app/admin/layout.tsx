import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { AdminLayout } from "@/widgets/admin-layout";

const locale = "ja";

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

	const messages = await getMessages({ locale });

	return (
		// 管理画面は日本語で固定だが、Lightboxコンポーネントなどでは next-intl を利用しているので
		// Providerを使用する必要がある
		<NextIntlClientProvider messages={messages} locale={locale}>
			<AdminLayout user={session?.user}>{children}</AdminLayout>
		</NextIntlClientProvider>
	);
}
