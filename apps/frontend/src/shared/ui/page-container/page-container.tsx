import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

interface PageContainerProps {
	/** コンテナ内に表示するコンテンツ */
	children: ReactNode;
	/**
	 * 内側コンテンツに付与する追加クラス。
	 * 主に縦方向の間隔（例: "space-y-16"）をページごとに指定するために使う。
	 */
	className?: string;
}

/**
 * ページ共通のコンテンツコンテナ。
 *
 * @description
 * トップ・Blog・Aboutなど主要ページのコンテンツ最大幅（max-w-5xl）と
 * 左右パディングを一元管理するレイアウトコンポーネント。
 * 幅指定をここに集約することで、ページ間でコンテンツ幅が揃うようにしている。
 * 縦方向の間隔などページ固有の調整は className で渡す。
 */
export function PageContainer({ children, className }: PageContainerProps) {
	return (
		<main className="container mx-auto px-4 py-8">
			<div className={cn("max-w-5xl mx-auto", className)}>{children}</div>
		</main>
	);
}
