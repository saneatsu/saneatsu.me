import type { Locale } from "@saneatsu/i18n";
import { locales } from "@saneatsu/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { MobileMenu } from "@/widgets/mobile-menu";

import { LayoutShell } from "./layout-shell";

function isValidLocale(locale: string): locale is Locale {
	return locales.includes(locale as Locale);
}

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

/**
 * ロケールごとのメタデータを生成
 *
 * @description
 * hreflangタグを含むメタデータを生成して、
 * 検索エンジンに言語バージョンの存在を伝える。
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;

	// 現在のロケールに応じたタイトルと説明
	const metadata: Record<Locale, { title: string; description: string }> = {
		ja: {
			title: "saneatsu.me",
			description:
				"プログラミング、開発ツール、日常の気づきなど、技術とライフスタイルに関する記事を発信しています。",
		},
		en: {
			title: "saneatsu.me",
			description:
				"Articles about programming, development tools, and daily insights on technology and lifestyle.",
		},
		es: {
			title: "saneatsu.me",
			description:
				"Artículos sobre programación, herramientas de desarrollo y reflexiones cotidianas sobre tecnología y estilo de vida.",
		},
	};

	const currentMetadata = isValidLocale(locale)
		? metadata[locale]
		: metadata.en;

	return {
		title: currentMetadata.title,
		description: currentMetadata.description,
		alternates: {
			// hreflang: 各言語バージョンの存在を検索エンジンに伝える。
			// locales に追加した言語は自動的にすべて対象になる。
			languages: Object.fromEntries(
				locales.map((supportedLocale) => [
					supportedLocale,
					`/${supportedLocale}`,
				])
			),
		},
	};
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;

	// ロケールの検証
	if (!isValidLocale(locale)) {
		notFound();
	}

	// メッセージの取得
	const messages = await getMessages({ locale });

	return (
		<NextIntlClientProvider messages={messages} locale={locale}>
			<LayoutShell
				header={<Header />}
				footer={<Footer />}
				mobileMenu={<MobileMenu />}
			>
				{children}
			</LayoutShell>
		</NextIntlClientProvider>
	);
}

// 静的パラメータの生成
export async function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}
