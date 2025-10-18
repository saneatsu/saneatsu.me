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

/**
 * タグ作成リクエストボディ
 */
export interface TagCreateRequest {
	/** タグのスラッグ（小文字の英数字とハイフンのみ、1-100文字） */
	slug: string;
}

/**
 * タグ作成APIのレスポンス
 */
export interface TagCreateResponse {
	/** 作成されたタグデータ */
	data: {
		/** タグのユニークID */
		id: number;
		/** タグのスラッグ */
		slug: string;
		/** 作成日時 */
		createdAt: string;
		/** 更新日時 */
		updatedAt: string;
	};
	/** 成功メッセージ */
	message: string;
}

/**
 * タグ更新リクエストボディ
 */
export interface TagUpdateRequest {
	/** タグのスラッグ（小文字の英数字とハイフンのみ、1-100文字） */
	slug: string;
}

/**
 * タグ更新APIのレスポンス
 */
export interface TagUpdateResponse {
	/** 更新されたタグデータ */
	data: {
		/** タグのユニークID */
		id: number;
		/** タグのスラッグ */
		slug: string;
		/** 作成日時 */
		createdAt: string;
		/** 更新日時 */
		updatedAt: string;
	};
	/** 成功メッセージ */
	message: string;
}
