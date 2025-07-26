import type * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Skeleton - ローディング状態を示すスケルトンコンポーネント
 * 
 * @description
 * コンテンツの読み込み中に表示するプレースホルダー。
 * アニメーション付きで視覚的なフィードバックを提供。
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("bg-accent animate-pulse rounded-md", className)}
			{...props}
		/>
	);
}

export { Skeleton };