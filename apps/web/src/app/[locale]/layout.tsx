import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { Footer } from "../../widgets/footer";
import { Header } from "../../widgets/header";
import { ThemeProvider } from "../../shared";
import "../globals.css";

export const metadata: Metadata = {
	title: "Saneatsu Blog",
	description: "技術とライフスタイルのブログ",
};

export default async function LocaleLayout({
	children,
	params,
}: Readonly<{
	children: ReactNode;
	params: Promise<{ locale: string }>;
}>) {
	const { locale } = await params;
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<body>
				<NextIntlClientProvider messages={messages}>
					<ThemeProvider defaultTheme="system">
						<div className="relative flex min-h-screen flex-col">
							<Header />
							<main className="flex-1">{children}</main>
							<Footer />
						</div>
					</ThemeProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
