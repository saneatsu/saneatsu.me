// @ts-nocheck - React 19 compatibility issue with react-markdown
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ArticleChatPanel } from "@/features/article-chat";
import { RelatedArticles } from "@/features/article-management";
import type { Article } from "@/shared";
import { extractHeadings } from "@/shared/lib";
import { useChatPanelPortal } from "@/shared/ui";

import { ArticleContent } from "./article-content";
import { ArticleHeader } from "./article-header";

export interface ArticleDetailViewProps {
	/** 表示する記事データ */
	article: Article;
	/** 現在のロケール */
	locale: string;
}

/**
 * 記事詳細ページのメインビューコンポーネント
 *
 * @description
 * 個別記事の詳細を表示するビューコンポーネント。
 * 記事のヘッダー、本文、関連記事を組み立てるオーケストレーター。
 * AIチャットパネルの開閉状態を管理し、コンテキスト経由でレイアウト層にチャットパネルを渡す。
 *
 * @param props.article - 表示する記事データ
 * @param props.locale - 現在のロケール（後方互換性のため残しているが、内部では useLocale() を使用）
 */
export function ArticleDetailView({
	article,
	locale: _locale,
}: ArticleDetailViewProps) {
	const locale = useLocale();
	const t = useTranslations("article");
	const [isChatOpen, setIsChatOpen] = useState(false);
	const { setChatNode } = useChatPanelPortal();

	// チャットパネルをコンテキスト経由でレイアウト層に登録する
	// レイアウト側のLayoutShellがFlexカラムとしてチャットパネルを表示する
	useEffect(() => {
		if (isChatOpen) {
			setChatNode(
				<ArticleChatPanel
					articleContent={article.content}
					onClose={() => setIsChatOpen(false)}
				/>
			);
		} else {
			setChatNode(null);
		}
		return () => setChatNode(null);
	}, [isChatOpen, article.content, setChatNode]);

	// Markdownから見出しを抽出
	const headings = extractHeadings(article.content);

	// 記事のURLを生成（SSR時はフォールバック、CSR時はwindow.location.originを使用）
	const baseUrl =
		typeof window !== "undefined"
			? window.location.origin
			: "https://saneatsu.me";
	const articleUrl = `${baseUrl}/blog/${article.slug}`;

	return (
		<div className="container mx-auto px-4 py-6">
			<article className="max-w-6xl mx-auto space-y-8">
				<ArticleHeader article={article} />

				<ArticleContent
					article={article}
					locale={locale as "ja" | "en"}
					articleUrl={articleUrl}
					headings={headings}
					articleContent={article.content}
					isChatOpen={isChatOpen}
					onToggleChat={() => setIsChatOpen((prev) => !prev)}
				/>

				{/* 関連記事セクション */}
				<section className="pt-8 border-t">
					<div className="max-w-5xl mx-auto">
						<h2 className="text-xl font-bold mb-6">
							{t("relatedArticles.title")}
						</h2>
						<RelatedArticles slug={article.slug} limit={10} />
					</div>
				</section>
			</article>
		</div>
	);
}
