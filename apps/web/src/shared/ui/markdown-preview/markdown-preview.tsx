"use client";

import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { remarkTag } from "@/shared/lib/remark-tag";
import { remarkUrlCard } from "@/shared/lib/remark-url-card";
import { remarkWikiLink } from "@/shared/lib/remark-wiki-link";

import { ArticleImage } from "../article-image/article-image";

// Wiki Linkコンポーネントを動的インポート（クライアントサイドのみ）
const WikiLink = dynamic(
	() => import("@/entities/article").then((mod) => mod.WikiLink),
	{
		ssr: false,
	}
);

// URL Cardコンポーネントを動的インポート（クライアントサイドのみ）
const UrlCard = dynamic(
	() =>
		import("@/entities/article/ui/url-card/url-card").then(
			(mod) => mod.UrlCard
		),
	{
		ssr: false,
	}
);

/**
 * MarkdownPreviewのプロパティ
 */
export interface MarkdownPreviewProps {
	/** 表示するMarkdownコンテンツ */
	content: string;
	/** 言語設定（Wiki Link用） */
	language?: "ja" | "en";
	/** 追加のCSSクラス */
	className?: string;
	/** カスタムコンポーネント */
	components?: Partial<Components>;
}

/**
 * Markdownプレビューコンポーネント
 *
 * @description
 * Markdownテキストをレンダリングして表示する再利用可能なコンポーネント。
 *
 * 機能：
 * - GitHub Flavored Markdown (GFM) サポート
 * - Wiki Link機能 ([[記事名]]、[[記事名#見出し]])
 * - タグ機能 (#タグ名)
 * - proseスタイル適用
 * - ダークモード対応
 * - カスタムコンポーネント注入可能
 *
 * @example
 * ```tsx
 * <MarkdownPreview
 *   content="# Hello World\n\nThis is a [[wiki-link]] and #tag"
 *   language="ja"
 * />
 * ```
 */
export function MarkdownPreview({
	content,
	language = "ja",
	className = "",
	components: customComponents,
}: MarkdownPreviewProps) {
	const { theme } = useTheme();

	const defaultComponents: Partial<Components> = {
		// Wiki Linkのカスタムレンダリング
		a: ({ children, href, ...props }) => {
			const classNames = (props as { className?: string }).className;

			// URL Cardの判定
			const isUrlCard = classNames?.includes("url-card-link");
			if (isUrlCard && href) {
				console.log("Rendering URL card for:", href);
				return <UrlCard url={href} />;
			}

			// Wiki Linkの判定
			const isWikiLink = classNames?.includes("wiki-link");
			if (isWikiLink && href) {
				return (
					<WikiLink
						href={href}
						language={language}
						className={classNames}
						{...props}
					>
						{children}
					</WikiLink>
				);
			}

			// 通常のリンク
			return (
				<a href={href} className="underline" {...props}>
					{children}
				</a>
			);
		},
		// 画像のカスタムレンダリング
		img: ({ src, alt, ...props }) => {
			// Cloudflare Images URLの場合はArticleImageを使用
			if (src?.includes("imagedelivery.net")) {
				return <ArticleImage src={src} alt={alt} />;
			}

			// 通常の画像（外部URL）
			// biome-ignore lint/performance/noImgElement: 外部画像URLはNext.js Imageで最適化できないため<img>を使用
			return <img src={src} alt={alt} {...props} />;
		},
	};

	// カスタムコンポーネントとデフォルトコンポーネントをマージ
	const mergedComponents = {
		...defaultComponents,
		...customComponents,
	};

	return (
		<div
			className={`prose dark:prose-invert max-w-none ${className}`}
			data-color-mode={theme === "dark" ? "dark" : "light"}
		>
			<ReactMarkdown
				remarkPlugins={[remarkGfm, remarkUrlCard, remarkWikiLink, remarkTag]}
				components={mergedComponents}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
