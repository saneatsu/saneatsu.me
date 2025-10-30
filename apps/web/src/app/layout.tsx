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
