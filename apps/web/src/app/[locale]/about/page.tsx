import type { Metadata } from "next";
import { AboutView } from "../../../views";

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
			description:
				"フルスタック開発者Saneatsuの自己紹介ページ。技術スタック、経歴、趣味・関心事、連絡先情報を掲載しています。",
		},
		en: {
			title: "About - saneatsu.me",
			description:
				"About page of Saneatsu, a full-stack developer. Learn about tech stack, experience, interests, and contact information.",
		},
	};

	const currentMetadata =
		metadata[locale as keyof typeof metadata] || metadata.ja;

	return {
		title: currentMetadata.title,
		description: currentMetadata.description,
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
 * Saneatsuの自己紹介、技術スキル、経歴、趣味・関心事、
 * 連絡先情報を表示するページ。
 */
export default function AboutPage() {
	return <AboutView />;
}
