import type { Metadata } from "next";

import { AboutView } from "@/views";

type Props = {
	params: Promise<{ locale: string }>;
};

/**
 * Aboutページのメタデータを生成
 *
 * @description
 * 各言語でのSEO対応メタデータを生成し、
 * hreflangタグで言語バージョンを指定。
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;

	const metadata = {
		ja: {
			title: "About - saneatsu.me",
		},
		en: {
			title: "About - saneatsu.me",
		},
	};

	const currentMetadata =
		metadata[locale as keyof typeof metadata] || metadata.ja;

	return {
		title: currentMetadata.title,
		alternates: {
			languages: {
				ja: "/ja/about",
				en: "/en/about",
			},
		},
	};
}

/**
 * Aboutページ
 *
 * @description
 * Saneatsuの技術スタック、経歴、連絡先情報を表示するページ。
 */
export default function AboutPage() {
	return <AboutView />;
}
