"use client";

import type { ComponentPropsWithoutRef } from "react";

import { useGetArticleBySlug } from "@/entities/article";
import { cn, Link } from "@/shared/lib";

/**
 * Wiki Linkコンポーネントのプロパティ
 */
export interface WikiLinkProps extends ComponentPropsWithoutRef<"a"> {
	/** リンク先のURL */
	href: string;
	/** 言語設定 */
	language?: "ja" | "en";
	/** デフォルトの表示テキスト（タイトル取得中の表示用） */
	children: React.ReactNode;
}

/**
 * Wiki Link表示コンポーネント
 *
 * @description
 * Wiki Link記法で指定されたスラッグから記事タイトルを取得して表示します。
 * アンカーリンクがある場合は青色で表示されます。
 *
 * @example
 * ```tsx
 * <WikiLink href="/blog/nextjs-basics">nextjs-basics</WikiLink>
 * <WikiLink href="/blog/nextjs-basics#routing">nextjs-basics#routing</WikiLink>
 * ```
 */
export function WikiLink({
	href,
	language = "ja",
	children,
	className,
	...props
}: WikiLinkProps) {
	// URLからスラッグとアンカーを抽出
	const match = href.match(/^\/blog\/([^#]+)(#.*)?$/);
	const slug = match?.[1];
	const anchor = match?.[2] || "";

	// 記事情報を取得
	const { data, isLoading, isError } = useGetArticleBySlug({
		slug: slug || "",
		language,
		queryConfig: {
			enabled: !!slug,
			staleTime: 5 * 60 * 1000, // 5分間キャッシュ
			gcTime: 10 * 60 * 1000, // 10分間保持
		},
	});

	// エラー状態（記事が見つからない場合）
	if (isError) {
		return (
			<span
				className={cn("text-destructive pointer-events-none", className)}
				{...props}
			>
				記事が見つかりません
			</span>
		);
	}

	// 表示テキストの決定
	let displayText = children;
	if (data?.data?.title) {
		if (anchor) {
			// アンカー部分をデコード（#を除去してデコード後、#を戻す）
			const decodedAnchor = anchor.startsWith("#")
				? `#${decodeURIComponent(anchor.substring(1))}`
				: decodeURIComponent(anchor);
			displayText = `${data.data.title}${decodedAnchor}`;
		} else {
			displayText = data.data.title;
		}
	}

	// アンカーリンクがある場合は青色にする
	const isAnchorLink = !!anchor;

	return (
		<Link
			href={href}
			className={cn(
				"underline decoration-dotted underline-offset-4 hover:decoration-solid",
				isAnchorLink && "text-primary",
				isLoading && "opacity-70",
				className
			)}
			{...props}
		>
			{displayText}
		</Link>
	);
}
