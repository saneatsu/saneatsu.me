import type { Metadata } from "next";

import { GalleryForm } from "@/features/gallery-management";

/**
 * ページメタデータ
 */
export const metadata: Metadata = {
	title: "ギャラリー画像の新規作成",
	description: "新しいギャラリー画像をアップロードします",
};

/**
 * ギャラリー画像新規作成ページ
 *
 * @description
 * ギャラリー画像をアップロードするためのフォームページ。
 *
 * 機能:
 * - 画像ファイルのアップロード
 * - 日本語・英語のタイトル・説明入力
 * - 撮影日時の設定
 * - 位置情報の設定（住所検索、座標入力、地図選択）
 */
export default function GalleryNewPage() {
	return (
		<div className="space-y-6">
			<GalleryForm />
		</div>
	);
}
