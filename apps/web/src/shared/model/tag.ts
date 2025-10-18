/**
 * タグオブジェクト（API レスポンス用）
 * バックエンドの TagSchema に対応
 */
export interface Tag {
	/** タグのユニークID */
	id: number;
	/** タグのスラッグ（日本語名） */
	slug: string;
	/** 作成日時 */
	createdAt: string;
	/** 更新日時 */
	updatedAt: string;
	/** このタグが付けられた記事の数 */
	articleCount: number;
}

/**
 * タグ一覧APIのレスポンス
 */
export interface TagsResponse {
	/** タグデータの配列 */
	data: Tag[];
}
