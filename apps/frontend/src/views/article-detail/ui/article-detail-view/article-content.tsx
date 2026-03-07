import type { useTranslations } from "next-intl";
import rehypeHighlight from "rehype-highlight";
import { siMarkdown } from "simple-icons";

import type { Article } from "@/shared";
import type { HeadingItem } from "@/shared/lib";
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
	/** Markdownコンテンツをクリップボードにコピーするハンドラ */
	onCopyMarkdown: () => Promise<void>;
	/** シェア翻訳関数 */
	tShare: ReturnType<typeof useTranslations<"share">>;
	/** 記事翻訳関数 */
	t: ReturnType<typeof useTranslations<"article">>;
}

/**
 * 記事本文コンポーネント
 *
 * @description
 * Markdownコピーボタン、シェアボタン、Markdown本文、目次サイドバーの2カラムレイアウトを表示する。
 */
export function ArticleContent({
	article,
	locale,
	articleUrl,
	headings,
	onCopyMarkdown,
	tShare,
	t,
}: ArticleContentProps) {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
			<div className="min-w-0 space-y-8 order-2 lg:order-1">
				{/* Markdownコピーボタン + シェアボタン（上部） */}
				<div className="flex justify-between items-center">
					<button
						type="button"
						onClick={onCopyMarkdown}
						className="flex items-center gap-1.5 rounded-md pr-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
						aria-label="Copy Markdown"
					>
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
						{tShare("copyMarkdownTooltip")}
					</button>
					<ShareButtons url={articleUrl} title={article.title || ""} />
				</div>

				{/* 記事本文 */}
				<MarkdownPreview
					content={article.content || ""}
					language={locale}
					className="prose-neutral"
					rehypePlugins={[rehypeHighlight]}
					imageComponent="zoomable"
					headings={headings}
				/>

				{/* シェアボタン（下部） */}
				<div className="flex justify-end">
					<ShareButtons url={articleUrl} title={article.title || ""} />
				</div>
			</div>

			{/* 目次サイドバー */}
			<aside className="order-1 lg:order-2 lg:sticky lg:top-20 lg:h-fit lg:w-[300px]">
				<div className="rounded-lg border bg-card p-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
					<TableOfContents headings={headings} title={t("tableOfContents")} />
				</div>
			</aside>
		</div>
	);
}
