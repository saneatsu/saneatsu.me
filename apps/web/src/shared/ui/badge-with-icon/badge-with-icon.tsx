import type { SimpleIcon } from "simple-icons";

import { cn } from "@/shared/lib/utils";

/**
 * hex値から相対輝度を計算する
 *
 * @description
 * WCAG 2.0 の相対輝度計算式を使用して、hex値（例："F7DF1E"）から
 * 0〜1の範囲の輝度値を計算する。
 *
 * 計算手順：
 * 1. hex → RGB変換
 * 2. RGB値を0-1の範囲に正規化
 * 3. sRGB → 線形RGB変換
 * 4. 輝度 = 0.2126 × R + 0.7152 × G + 0.0722 × B
 *
 * @param hex - hex値（6文字、例："F7DF1E"）
 * @returns 0〜1の範囲の輝度値
 */
function calculateLuminance(hex: string): number {
	// 1. hex → RGB変換
	const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
	const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
	const b = Number.parseInt(hex.slice(4, 6), 16) / 255;

	// 2. sRGB → 線形RGB変換
	const toLinear = (c: number): number => {
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};

	const rLinear = toLinear(r);
	const gLinear = toLinear(g);
	const bLinear = toLinear(b);

	// 3. 輝度計算
	return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * 背景色の輝度に基づいてアイコンの色を決定する
 *
 * @description
 * 輝度が閾値（0.5）より高い場合は黒色、低い場合は白色を返す。
 * これにより、明るい背景色には黒色のアイコン、暗い背景色には白色のアイコンが
 * 表示され、視認性が向上する。
 *
 * @param hex - hex値（6文字、例："F7DF1E"）
 * @returns "#000000"（黒色）または "#ffffff"（白色）
 */
function getIconColor(hex: string): string {
	const luminance = calculateLuminance(hex);
	// 輝度が0.5より高い（明るい）場合は黒色、そうでない場合は白色
	return luminance > 0.5 ? "#000000" : "#ffffff";
}

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
					fill={getIconColor(icon.hex)}
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
