import type { Metadata } from "next";

import { GalleryForm } from "@/features/gallery-management";

/**
 * ページメタデータ
 */
export const metadata: Metadata = {
	title: "ギャラリー画像の編集",
	description: "ギャラリー画像の情報を編集します",
};

/**
 * ギャラリー画像編集ページのプロパティ
 */
interface GalleryEditPageProps {
	params: {
		id: string;
	};
}

/**
 * ギャラリー画像編集ページ
 *
 * @description
 * ギャラリー画像を編集するためのフォームページ。
 *
 * 機能:
 * - 画像情報の編集（タイトル、説明、撮影日時、位置情報）
 * - 画像ファイルの差し替え（オプション）
 * - 位置情報の設定（住所検索、座標入力、地図選択）
 */
export default function GalleryEditPage({ params }: GalleryEditPageProps) {
	const imageId = Number.parseInt(params.id, 10);

	return (
		<div className="space-y-6">
			<GalleryForm mode="edit" imageId={imageId} />
		</div>
	);
}
