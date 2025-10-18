import type { SimpleIcon } from "simple-icons";

import { cn } from "@/shared/lib/utils";

/**
 * BadgeWithIconコンポーネントのProps
 */
type BadgeWithIconProps = {
	/** Simple Iconsのアイコンオブジェクト */
	icon: SimpleIcon;
	/** 表示するテキスト */
	text: string;
	/** カスタムクラス名 */
	className?: string;
};

/**
 * アイコン付きバッジコンポーネント
 *
 * @description
 * 技術スタックなどを視覚的に表示するための、
 * アイコンとテキストを組み合わせたバッジコンポーネント。
 *
 * アイコン部分は円形の背景を持ち、各技術のブランドカラーを使用。
 * テキスト部分はsecondaryバッジスタイルで統一。
 *
 * @example
 * ```tsx
 * import { siReact } from "simple-icons";
 *
 * <BadgeWithIcon icon={siReact} text="React" />
 * ```
 */
export function BadgeWithIcon({ icon, text, className }: BadgeWithIconProps) {
	return (
		<div className={cn("inline-flex items-center overflow-hidden", className)}>
			{/* アイコン部分：円形背景 */}
			<div
				className="flex h-7 w-7 shrink-0 items-center justify-center rounded-l-full"
				style={{ backgroundColor: `#${icon.hex}` }}
			>
				<svg
					role="img"
					viewBox="0 0 24 24"
					className="h-3.5 w-3.5"
					fill="white"
					aria-label={icon.title}
				>
					<title>{icon.title}</title>
					<path d={icon.path} />
				</svg>
			</div>

			{/* テキスト部分：Badgeスタイル */}
			<span className="bg-secondary text-secondary-foreground rounded-r-full px-2 py-1 text-sm font-medium">
				{text}
			</span>
		</div>
	);
}
