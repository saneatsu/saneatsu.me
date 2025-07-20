import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "../components/theme-provider";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
	title: "Saneatsu Blog",
	description: "技術とライフスタイルのブログ",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html lang="ja" suppressHydrationWarning>
			<body>
				<ThemeProvider defaultTheme="system">
					<div className="relative flex min-h-screen flex-col">
						<Header />
						<main className="flex-1">{children}</main>
						<Footer />
					</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
