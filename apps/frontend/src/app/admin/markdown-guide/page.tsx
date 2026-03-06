import type { Metadata } from "next";

import { MarkdownGuideView } from "@/views/markdown-guide";

export const metadata: Metadata = {
	title: "Markdown記法ガイド | 管理画面",
};

/**
 * Markdown記法ガイドページ
 *
 * @description
 * 管理画面の記事作成・編集時に参照できるMarkdown記法の一覧を表示する。
 */
export default function MarkdownGuidePage() {
	return <MarkdownGuideView />;
}
