/**
 * ナビゲーションアイテムの型定義
 */
export interface NavigationItem {
	/** ナビゲーション先のパス */
	path: string;
	/** 表示ラベル（常に英語） */
	label: string;
}

/**
 * サイト全体で使用するナビゲーションアイテム
 *
 * @description
 * ヘッダーとモバイルメニューで共通のナビゲーションアイテムを定義。
 * デスクトップヘッダーでは Home を除外して表示し、
 * モバイルメニューでは全て表示する。
 */
export const navigationItems: NavigationItem[] = [
	{ path: "/", label: "Home" },
	{ path: "/blog", label: "Blog" },
	{ path: "/about", label: "About" },
	{ path: "/gallery", label: "Gallery" },
];
