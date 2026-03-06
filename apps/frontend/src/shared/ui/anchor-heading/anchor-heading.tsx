import { Link } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

type AnchorHeadingProps = {
	/** 見出しレベル */
	level: "h2" | "h3";
	/** URLフラグメントに使用するid（英語kebab-case） */
	id: string;
	children: ReactNode;
	className?: string;
};

/**
 * アンカーリンク付きの見出しコンポーネント
 *
 * @description
 * 見出しにid属性を付与し、ホバー時にリンクアイコンを表示する。
 * クリックするとURLフラグメントが更新され、特定セクションへの直接リンクが可能になる。
 * scroll-mt-20でナビバー分のスクロールオフセットを確保している。
 */
export function AnchorHeading({
	level,
	id,
	children,
	className,
}: AnchorHeadingProps) {
	const Tag = level;

	const headingStyles = cn(
		"scroll-mt-20 group",
		level === "h2" && "text-2xl font-bold",
		level === "h3" && "text-lg font-semibold",
		className
	);

	return (
		<Tag id={id} className={headingStyles}>
			<a
				href={`#${id}`}
				className="inline-flex items-center gap-2 no-underline text-inherit hover:text-inherit"
				aria-label={`${typeof children === "string" ? children : id}へのリンク`}
			>
				{children}
				<Link
					className="size-4 opacity-0 group-hover:opacity-70 transition-opacity"
					aria-hidden="true"
				/>
			</a>
		</Tag>
	);
}
