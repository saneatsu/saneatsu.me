import { useLocale } from "next-intl";

import type { Tag } from "@/shared";
import { Badge } from "@/shared/ui";

export interface TagBadgeProps {
	/** 表示するタグオブジェクト */
	tag: Tag;
	/** 追加のCSSクラス */
	className?: string;
}

/**
 * タグバッジコンポーネント
 *
 * @description
 * タグを小さなバッジとして表示するコンポーネント。
 * ロケールに応じて適切な言語のタグ名を表示する。
 *
 * 機能：
 * 1. ロケールに基づいた自動翻訳表示
 * 2. outline variantで軽量な見た目
 * 3. 小さめのサイズ設定
 *
 * @example
 * ```tsx
 * <TagBadge tag={tag} />
 * ```
 */
export function TagBadge({ tag, className }: TagBadgeProps) {
	const locale = useLocale() as "ja" | "en";

	// ロケールに応じたタグ名を取得、なければslugをフォールバック
	const tagName = tag.translations[locale] || tag.slug;

	return (
		<Badge variant="outline" className={className}>
			{tagName}
		</Badge>
	);
}
