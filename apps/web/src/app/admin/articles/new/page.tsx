import { ArticleNewForm } from "@/features/article-management";

/**
 * 記事新規作成ページ
 *
 * @description
 * 新しい記事を作成するためのフォームページ。
 * タイトル、スラッグ、内容、タグ、ステータスを入力し、
 * 保存時に自動翻訳を実行して多言語での記事を作成する。
 */
export default function ArticleNewPage() {
	return <ArticleNewForm />;
}
