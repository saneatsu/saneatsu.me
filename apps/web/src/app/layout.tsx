import type { Metadata } from "next";

import { Providers } from "./providers";
import "./globals.css";

/**
 * サイト全体のメタデータ
 *
 * @description
 * すべてのページで共通のメタデータを設定する。
 * 各ページで上書きされない限り、これらの値が使用される。
 */
export const metadata: Metadata = {
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_SITE_URL || "https://saneatsu.me"
	),
	title: {
		default: "saneatsu.me",
		template: "%s - saneatsu.me",
	},
	// ブラウザUIの色をページ背景色と統一（globals.cssの--backgroundの値を使用）
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "hsl(0 0% 100%)" },
		{ media: "(prefers-color-scheme: dark)", color: "hsl(0 0% 3.9%)" },
	],
	openGraph: {
		type: "website",
		locale: "ja_JP",
		siteName: "saneatsu.me",
	},
	twitter: {
		card: "summary_large_image",
		site: "@saneatsu_wakana",
		creator: "@saneatsu_wakana",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ja" suppressHydrationWarning>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
