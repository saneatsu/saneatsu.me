"use client";

import { useEffect, useState } from "react";
import type { HeadingItem, NestedHeading } from "../../lib/extract-headings";
import { cn } from "../../lib/utils";

/**
 * ヘッダーレベルに応じたインデントクラスを返す
 */
function getIndentClass(level: number): string {
	switch (level) {
		case 1:
			return "pl-0";
		case 2:
			return "pl-3";
		case 3:
			return "pl-6";
		case 4:
			return "pl-9";
		case 5:
			return "pl-12";
		case 6:
			return "pl-15";
		default:
			return "pl-0";
	}
}

export interface TableOfContentsProps {
	/** 表示するヘッダー項目（フラットな配列またはネストした構造） */
	headings: HeadingItem[] | NestedHeading[];
	/** 目次のタイトル */
	title?: string;
	/** カスタムクラス名 */
	className?: string;
	/** 現在アクティブなヘッダーのID */
	activeId?: string;
}

/**
 * 目次コンポーネント
 *
 * @description
 * Markdownから抽出したヘッダー情報を元に目次を表示します。
 * 各項目をクリックすると対応するヘッダーにスムーズスクロールします。
 *
 * @param props.headings - 表示するヘッダー項目
 * @param props.title - 目次のタイトル（デフォルト: "目次"）
 * @param props.className - カスタムクラス名
 * @param props.activeId - 現在アクティブなヘッダーのID
 *
 * @example
 * ```tsx
 * const headings = extractHeadings(markdownContent);
 *
 * <TableOfContents
 *   headings={headings}
 *   title="目次"
 *   className="sticky top-4"
 * />
 * ```
 */
export function TableOfContents({
	headings,
	title = "目次",
	className,
	activeId,
}: TableOfContentsProps) {
	const [currentActiveId, setCurrentActiveId] = useState<string | undefined>(
		activeId
	);

	// アンカーリンクへのスムーズスクロール
	const handleClick = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	};

	// 現在の表示位置に基づいてアクティブなヘッダーを更新
	useEffect(() => {
		if (typeof window === "undefined" || headings.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// 画面に表示されているヘッダーを取得
				const visibleHeadings = entries
					.filter((entry) => entry.isIntersecting)
					.map((entry) => entry.target.id);

				if (visibleHeadings.length > 0) {
					// 最初に表示されているヘッダーをアクティブに設定
					setCurrentActiveId(visibleHeadings[0]);
				}
			},
			{
				// ヘッダー要素が画面の上部20%の位置に来たときに検出
				rootMargin: "-20% 0px -80% 0px",
				threshold: 0,
			}
		);

		// すべてのヘッダー要素を監視対象に追加
		const flatHeadings = flattenHeadings(headings);
		flatHeadings.forEach((heading) => {
			const element = document.getElementById(heading.id);
			if (element) {
				observer.observe(element);
			}
		});

		return () => {
			observer.disconnect();
		};
	}, [headings]);

	// headingsが空の場合は何も表示しない
	if (headings.length === 0) {
		return null;
	}

	const flatHeadings = flattenHeadings(headings);

	return (
		<nav className={cn("space-y-2", className)}>
			<h3 className="font-semibold text-sm text-foreground mb-3">{title}</h3>
			<ul className="space-y-1">
				{flatHeadings.map((heading) => (
					<li key={heading.id}>
						<button
							type="button"
							onClick={() => handleClick(heading.id)}
							className={cn(
								"block w-full text-left text-sm transition-colors hover:text-foreground",
								// インデントをレベルに応じて調整
								getIndentClass(heading.level),
								// アクティブな項目をハイライト
								currentActiveId === heading.id
									? "text-foreground font-medium"
									: "text-muted-foreground"
							)}
						>
							{heading.text}
						</button>
					</li>
				))}
			</ul>
		</nav>
	);
}

/**
 * ネストした構造のヘッダーをフラットな配列に変換
 */
function flattenHeadings(
	headings: HeadingItem[] | NestedHeading[]
): HeadingItem[] {
	const result: HeadingItem[] = [];

	for (const heading of headings) {
		result.push({
			id: heading.id,
			text: heading.text,
			level: heading.level,
		});

		// NestedHeadingの場合、子要素も再帰的に処理
		if ("children" in heading && heading.children.length > 0) {
			result.push(...flattenHeadings(heading.children));
		}
	}

	return result;
}
