import type { Metadata } from "next";

import { ContactView } from "@/views";

type Props = {
	params: Promise<{ locale: string }>;
};

/**
 * お問い合わせページのメタデータを生成
 *
 * @description
 * 各言語でのSEO対応メタデータを生成し、
 * hreflangタグで言語バージョンを指定。
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;

	const metadata = {
		ja: {
			title: "Contact - saneatsu.me",
		},
		en: {
			title: "Contact - saneatsu.me",
		},
	};

	const currentMetadata =
		metadata[locale as keyof typeof metadata] || metadata.ja;

	return {
		title: currentMetadata.title,
		alternates: {
			languages: {
				ja: "/ja/contact",
				en: "/en/contact",
			},
		},
	};
}

/**
 * お問い合わせページ
 *
 * @description
 * お問い合わせフォームを表示するページ。
 */
export default function ContactPage() {
	return <ContactView />;
}
