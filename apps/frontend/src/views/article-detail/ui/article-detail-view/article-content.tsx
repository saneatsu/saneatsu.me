"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import rehypeHighlight from "rehype-highlight";
import { siMarkdown } from "simple-icons";
import { toast } from "sonner";

import type { Article } from "@/shared";
import type { HeadingItem } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { MarkdownPreview, ShareButtons, TableOfContents } from "@/shared/ui";

interface ArticleContentProps {
	/** 記事データ */
	article: Article;
	/** 現在のロケール */
	locale: "ja" | "en";
	/** 記事の共有用URL */
	articleUrl: string;
	/** Markdownから抽出した見出し一覧 */
	headings: HeadingItem[];
	/** 記事のMarkdownコンテンツ */
	articleContent: Article["content"];
	/** AIチャットパネルが開いているかどうか */
	isChatOpen: boolean;
	/** AIチャットパネルの開閉をトグルするコールバック */
	onToggleChat: () => void;
}

/**
 * 記事本文コンポーネント
 *
 * @description
 * Markdownコピーボタン、シェアボタン、Markdown本文、目次サイドバーの2カラムレイアウトを表示する。
 * コピーボタンはインラインフィードバック（ローディング → 成功表示2秒）を持つ。
 * 「記事について質問」ボタンのトグルは親コンポーネントに委譲する。
 */
export function ArticleContent({
	article,
	locale,
	articleUrl,
	headings,
	articleContent,
	isChatOpen,
	onToggleChat,
}: ArticleContentProps) {
	const t = useTranslations("article");
	const tShare = useTranslations("share");
	const tChat = useTranslations("articleChat");
	const [isCopying, setIsCopying] = useState(false);
	const [isCopied, setIsCopied] = useState(false);

	/**
	 * 記事のMarkdownコンテンツをクリップボードにコピーする
	 *
	 * 1. ローディング状態に遷移
	 * 2. クリップボードにコピー
	 * 3. 成功時: Checkアイコン + 「コピーしました」を2秒間表示
	 * 4. 失敗時: toast.errorを表示
	 */
	const handleCopyMarkdown = useCallback(async () => {
		setIsCopying(true);
		try {
			await navigator.clipboard.writeText(articleContent);
			setIsCopying(false);
			setIsCopied(true);

			// 2秒後に通常状態に戻す
			setTimeout(() => {
				setIsCopied(false);
			}, 2000);
		} catch {
			setIsCopying(false);
			toast.error(tShare("copyMarkdownError"));
		}
	}, [articleContent, tShare]);

	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-8",
				!isChatOpen && "lg:grid-cols-[1fr_300px] lg:gap-12"
			)}
		>
			<div
				className={cn("min-w-0 space-y-8", !isChatOpen && "order-2 lg:order-1")}
			>
				{/* Markdownコピーボタン + 記事について質問ボタン + シェアボタン（上部） */}
				<div className="flex justify-between items-center">
					<div className="flex items-center">
						<button
							type="button"
							onClick={handleCopyMarkdown}
							disabled={isCopying}
							className="flex items-center gap-1.5 rounded-md pr-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Copy Markdown"
						>
							{isCopying ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : isCopied ? (
								<Check className="h-4 w-4 text-success-foreground" />
							) : (
								<svg
									role="img"
									viewBox="0 0 24 24"
									className="h-4 w-4"
									fill="currentColor"
									aria-label={siMarkdown.title}
								>
									<title>{siMarkdown.title}</title>
									<path d={siMarkdown.path} />
								</svg>
							)}
							{isCopied
								? tShare("copyMarkdownSuccess")
								: tShare("copyMarkdownTooltip")}
						</button>
						<button
							type="button"
							onClick={onToggleChat}
							className={cn(
								"flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
								isChatOpen
									? "text-primary"
									: "text-muted-foreground hover:text-foreground"
							)}
							aria-label={tChat("openChat")}
							aria-expanded={isChatOpen}
						>
							<Sparkles className="h-4 w-4" />
							{tChat("openChat")}
						</button>
					</div>
					<ShareButtons url={articleUrl} title={article.title} />
				</div>

				{/* 記事本文 */}
				<MarkdownPreview
					content={articleContent}
					language={locale}
					className="prose-neutral"
					rehypePlugins={[rehypeHighlight]}
					imageComponent="zoomable"
					headings={headings}
				/>

				{/* シェアボタン（下部） */}
				<div className="flex justify-end">
					<ShareButtons url={articleUrl} title={article.title} />
				</div>
			</div>

			{/* 目次サイドバー */}
			<aside
				className={cn(
					!isChatOpen
						? "order-1 lg:order-2 lg:sticky lg:top-20 lg:h-fit lg:w-[300px]"
						: ""
				)}
			>
				<div className="rounded-lg border bg-card p-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
					<TableOfContents headings={headings} title={t("tableOfContents")} />
				</div>
			</aside>
		</div>
	);
}
