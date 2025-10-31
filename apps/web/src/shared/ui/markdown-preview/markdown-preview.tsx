"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Children, isValidElement, useEffect } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";

import {
	remarkAmazon,
	remarkTag,
	remarkTweet,
	remarkUrlCard,
	remarkWikiLink,
	remarkYoutube,
} from "../../lib/";
import { removeMarkdownLinks } from "../../lib/extract-headings";
import { ArticleImage } from "../article-image/article-image";
// ZoomableImageは通常のimportを使用
// dynamic import (ssr: false) を使うと、画像クリック時に拡大されないバグが発生するため
import { ZoomableImage } from "../zoomable-image/zoomable-image";

/**
 * 共通のremarkPlugins設定
 *
 * @description
 * MarkdownPreviewで使用するremarkプラグインのリスト。
 * ArticleMarkdownEditorなど他のコンポーネントでも再利用可能。
 */
export const defaultRemarkPlugins = [
	remarkGfm,
	remarkUrlCard,
	remarkWikiLink,
	remarkTag,
	remarkTweet,
	remarkYoutube,
	remarkAmazon,
] as const;

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

// Tweet Embedコンポーネントを動的インポート（クライアントサイドのみ）
const TweetEmbed = dynamic(
	() => import("../tweet-embed/tweet-embed").then((mod) => mod.TweetEmbed),
	{
		ssr: false,
	}
);

// YouTube Embedコンポーネントを動的インポート（クライアントサイドのみ）
const YouTubeEmbed = dynamic(
	() =>
		import("../youtube-embed/youtube-embed").then((mod) => mod.YouTubeEmbed),
	{
		ssr: false,
	}
);

// Amazon Product Cardコンポーネントを動的インポート（クライアントサイドのみ）
const AmazonProductCard = dynamic(
	() => import("@/entities/article").then((mod) => mod.AmazonProductCard),
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
	/** rehypeプラグイン（オプショナル） */
	rehypePlugins?: PluggableList;
	/** 画像コンポーネントの種類（デフォルト: "article"） */
	imageComponent?: "article" | "zoomable";
	/** 見出し情報（アンカーリンク用） */
	headings?: Array<{ id: string; text: string }>;
}

/**
 * React childrenからテキストを再帰的に抽出する
 *
 * @description
 * ReactMarkdownがリンクを含む見出しをレンダリングする際、
 * childrenは文字列ではなくReactエレメント（<a>要素など）になる。
 * この関数はそのようなネストされた構造からテキストのみを抽出する。
 *
 * @param children - React children（文字列、配列、Reactエレメント）
 * @returns 抽出されたテキスト
 */
function extractTextFromChildren(children: React.ReactNode): string {
	if (typeof children === "string") {
		return children;
	}
	if (typeof children === "number") {
		return String(children);
	}
	if (Array.isArray(children)) {
		return children.map((child) => extractTextFromChildren(child)).join("");
	}
	if (
		children !== null &&
		typeof children === "object" &&
		"props" in children
	) {
		return extractTextFromChildren(
			(children as React.ReactElement).props.children
		);
	}
	return "";
}

/**
 * 子要素にブロック画像コンポーネントまたは画像タグが含まれているかチェックする
 *
 * @description
 * 以下のいずれかが含まれている場合にtrueを返す:
 * 1. ZoomableImageまたはArticleImageコンポーネント
 * 2. `<img>`タグ（ReactMarkdownが生成するもの）
 *
 * これらは内部で`<div>`を使用するか、`<div>`に変換されるため、
 * `<p>`タグの中に入れるとHTMLの仕様違反となりハイドレーションエラーが発生する。
 *
 * @param children - React children
 * @returns ブロック画像コンポーネントまたは画像タグが含まれている場合はtrue
 */
function hasBlockImage(children: React.ReactNode): boolean {
	const childArray = Children.toArray(children);
	return childArray.some((child) => {
		if (isValidElement(child)) {
			// ZoomableImageまたはArticleImageの場合
			if (child.type === ZoomableImage || child.type === ArticleImage) {
				return true;
			}
			// ReactMarkdownが生成する<img>タグの場合
			// node.tagNameまたはsrcプロパティで判定
			// imgコンポーネントでZoomableImageに変換される前にチェックする必要がある
			const props = child.props as {
				node?: { tagName?: string };
				src?: string;
			};
			if (props?.node?.tagName === "img" || props?.src) {
				return true;
			}
		}
		return false;
	});
}

/**
 * デフォルトのMarkdownコンポーネントを生成する関数
 *
 * @description
 * MarkdownPreviewで使用するデフォルトコンポーネント。
 * ArticleMarkdownEditorなど他のコンポーネントでも再利用可能。
 *
 * @param language - 言語設定（Wiki Link用）
 * @param imageComponent - 画像コンポーネントの種類
 * @param headings - 見出し情報（アンカーリンク用）
 */
export function createDefaultMarkdownComponents(
	language: "ja" | "en" = "ja",
	imageComponent: "article" | "zoomable" = "article",
	headings?: Array<{ id: string; text: string }>
): Partial<Components> {
	/**
	 * childrenからマッチする見出しのIDを取得する
	 *
	 * @description
	 * React childrenからテキストを抽出し、リンク構文を除去した後、
	 * headings配列から一致する見出しを検索してそのIDを返す。
	 *
	 * @param children - React children
	 * @returns マッチした見出しのID、なければundefined
	 */
	const getMatchedHeadingId = (
		children: React.ReactNode
	): string | undefined => {
		const childrenText = extractTextFromChildren(children);
		const cleanedText = removeMarkdownLinks(childrenText);
		const matchedHeading = headings?.find((h) => h.text === cleanedText);
		return matchedHeading?.id;
	};

	return {
		// 見出しのカスタムレンダリング
		h1: ({ children }) => (
			<h1
				id={getMatchedHeadingId(children)}
				className="text-2xl font-semibold mt-16 mb-3 border-b-4 border-double border-border pb-2 scroll-mt-20"
			>
				{children}
			</h1>
		),
		h2: ({ children }) => (
			<h2
				id={getMatchedHeadingId(children)}
				className="text-2xl font-bold mt-16 mb-3 border-b-4 border-double border-border pb-2 scroll-mt-20"
			>
				{children}
			</h2>
		),
		h3: ({ children }) => (
			<h3
				id={getMatchedHeadingId(children)}
				className="text-xl font-semibold mt-4 mb-2 border-b border-border pb-1 scroll-mt-20"
			>
				{children}
			</h3>
		),
		h4: ({ children }) => (
			<h4
				id={getMatchedHeadingId(children)}
				className="text-lg font-semibold mt-3 mb-2 border-b border-dashed border-border pb-1 scroll-mt-20"
			>
				{children}
			</h4>
		),
		h5: ({ children }) => (
			<h5
				id={getMatchedHeadingId(children)}
				className="text-base font-semibold mt-2 mb-1 scroll-mt-20"
			>
				{children}
			</h5>
		),
		h6: ({ children }) => (
			<h6
				id={getMatchedHeadingId(children)}
				className="text-sm font-semibold mt-2 mb-1 scroll-mt-20"
			>
				{children}
			</h6>
		),
		// 段落のカスタムレンダリング
		p: ({ children }) => {
			// ブロック画像が含まれている場合はdivでラップ（HTMLの仕様違反を避けるため）
			if (hasBlockImage(children)) {
				return <div className="mb-4">{children}</div>;
			}
			return (
				<p className="mb-4 text-muted-foreground leading-relaxed">{children}</p>
			);
		},
		// リストのカスタムレンダリング
		ul: ({ children }) => (
			<ul className="mb-0 ml-0 list-disc space-y-0">{children}</ul>
		),
		ol: ({ children }) => (
			<ol className="mb-0 ml-0 list-decimal space-y-0">{children}</ol>
		),
		li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
		// コードのカスタムレンダリング
		code: ({ children, className }) => {
			const isInline = !className;
			if (isInline) {
				return (
					<code className="bg-muted text-foreground px-1 py-0.5 rounded text-sm font-mono">
						{children}
					</code>
				);
			}
			// ブロックコードはhighlight.jsのスタイルを尊重
			return <code className={className}>{children}</code>;
		},
		pre: ({ children }) => (
			<pre className="p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
		),
		// 引用のカスタムレンダリング
		blockquote: ({ children }) => (
			<blockquote className="border-l-4 border-border pl-4 italic my-4">
				{children}
			</blockquote>
		),
		// リンクのカスタムレンダリング
		a: ({ children, href, ...props }) => {
			const classNames = (props as { className?: string }).className;

			// URL Cardの判定
			const isUrlCard = classNames?.includes("url-card-link");
			if (isUrlCard && href) {
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
				<a
					href={href}
					className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
					{...props}
				>
					{children}
				</a>
			);
		},
		// 画像のカスタムレンダリング
		img: ({ src, alt, ...props }) => {
			// 画像コンポーネントの種類に応じて切り替え
			if (imageComponent === "zoomable") {
				return <ZoomableImage src={src || ""} alt={alt || ""} />;
			}

			// Cloudflare Images URLの場合はArticleImageを使用
			if (src?.includes("imagedelivery.net")) {
				return <ArticleImage src={src} alt={alt} />;
			}

			// 通常の画像（外部URL）
			// biome-ignore lint/performance/noImgElement: 外部画像URLはNext.js Imageで最適化できないため<img>を使用
			return <img src={src} alt={alt} {...props} />;
		},
		// Tweet埋め込みのカスタムレンダリング
		// @ts-expect-error - カスタムノードのため型定義がない
		tweet: ({ id }) => <TweetEmbed id={id} />,
		// YouTube埋め込みのカスタムレンダリング
		// @ts-expect-error - カスタムノードのため型定義がない
		youtube: ({ videoId, startTime }) => (
			<YouTubeEmbed videoId={videoId} startTime={startTime} />
		),
		// Amazon商品カードのカスタムレンダリング
		// @ts-expect-error - カスタムノードのため型定義がない
		amazon: ({ url, asin, domain }) => (
			<AmazonProductCard url={url} asin={asin} domain={domain} />
		),
	};
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
 * - URL Card機能（単独行のURL）
 * - Tweet埋め込み機能
 * - YouTube埋め込み機能
 * - proseスタイル適用
 * - ダークモード対応
 * - カスタムコンポーネント注入可能
 * - rehypeプラグイン対応
 * - 画像コンポーネントの切り替え（ArticleImage / ZoomableImage）
 * - 見出しへのアンカーリンク対応
 *
 * @example
 * ```tsx
 * <MarkdownPreview
 *   content="# Hello World\n\nThis is a [[wiki-link]] and #tag"
 *   language="ja"
 *   rehypePlugins={[rehypeHighlight]}
 *   imageComponent="zoomable"
 *   headings={extractHeadings(content)}
 * />
 * ```
 */
export function MarkdownPreview({
	content,
	language = "ja",
	className = "",
	components: customComponents,
	rehypePlugins = [],
	imageComponent = "article",
	headings,
}: MarkdownPreviewProps) {
	const { resolvedTheme } = useTheme();

	// resolvedThemeの初期値がundefinedの場合に備えてfallbackを設定
	const currentTheme = resolvedTheme || "light";

	// テーマに応じてhighlight.jsのスタイルを動的に読み込む
	useEffect(() => {
		// 既存のhighlight.jsのスタイルシートを削除
		const existingLink = document.querySelector(
			"link[data-highlight-theme]"
		) as HTMLLinkElement;
		if (existingLink) {
			existingLink.remove();
		}

		// 新しいスタイルシートを追加
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.setAttribute("data-highlight-theme", "true");
		link.href =
			currentTheme === "dark"
				? "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css"
				: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css";
		document.head.appendChild(link);

		return () => {
			link.remove();
		};
	}, [currentTheme]);

	const defaultComponents = createDefaultMarkdownComponents(
		language,
		imageComponent,
		headings
	);

	// カスタムコンポーネントとデフォルトコンポーネントをマージ
	const mergedComponents = {
		...defaultComponents,
		...customComponents,
	};

	return (
		<div
			// H1, H2 の1つ目のmtは0
			className={`prose dark:prose-invert max-w-none bg-background [&>h1:first-child]:mt-0 [&>h2:first-child]:mt-0 ${className}`}
			data-color-mode={currentTheme === "dark" ? "dark" : "light"}
		>
			<ReactMarkdown
				remarkPlugins={[...defaultRemarkPlugins]}
				rehypePlugins={[rehypeHighlight, ...rehypePlugins]}
				components={mergedComponents}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
