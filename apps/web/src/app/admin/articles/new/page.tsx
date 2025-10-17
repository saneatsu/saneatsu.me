import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ArticleNewForm } from "@/features/article-management";

/**
 * 記事新規作成ページのメタデータ
 */
export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("admin.articles.new");

	return {
		title: t("title"),
		description: t("description"),
	};
}

/**
 * 記事新規作成ページ
 *
 * @description
 * 新しい記事を作成するためのフォームページ。
 * タイトル、スラッグ、内容、タグ、ステータスを入力し、
 * 保存時に自動翻訳を実行して多言語での記事を作成する。
 */
export default function ArticleNewPage() {
	return (
		<div className="container mx-auto py-6">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">記事の新規作成</h1>
				<p className="text-muted-foreground mt-2">
					新しい記事を作成します。日本語で入力した内容は自動的に他の言語にも翻訳されます。
				</p>
			</div>

			<ArticleNewForm />
		</div>
	);
}
