import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

// サポートされているロケール
const locales = ["ja", "en"] as const;
type Locale = (typeof locales)[number];

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
	};

	const currentMetadata = isValidLocale(locale)
		? metadata[locale]
		: metadata.ja;

	return {
		title: currentMetadata.title,
		description: currentMetadata.description,
		alternates: {
			languages: {
				ja: "/ja",
				en: "/en",
			},
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
			<div className="relative flex min-h-screen flex-col">
				<Header />
				<main className="flex-1">{children}</main>
				<Footer />
			</div>
		</NextIntlClientProvider>
	);
}

// 静的パラメータの生成
export async function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}
