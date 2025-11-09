import type { SVGProps } from "react";
import { siRakuten } from "simple-icons";

/**
 * 楽天ロゴコンポーネント
 *
 * @description
 * 楽天の公式ブランドロゴをSVG形式で表示する。
 * Simple Iconsから提供される楽天の「R」マークを使用。
 * currentColorを使用しているため、親要素のtext-colorに応じて色が変わる。
 *
 * @param props - SVG要素のプロパティ
 */
export function RakutenLogo(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			fill="currentColor"
			role="img"
			{...props}
		>
			<title>{siRakuten.title}</title>
			<path d={siRakuten.path} />
		</svg>
	);
}
