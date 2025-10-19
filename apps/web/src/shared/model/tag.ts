/**
 * タグオブジェクト（API レスポンス用）
 * バックエンドの TagSchema に対応
 */
export interface Tag {
	/** タグのユニークID */
	id: number;
	/** タグのスラッグ */
	slug: string;
	/** 作成日時 */
	createdAt: string;
	/** 更新日時 */
	updatedAt: string;
	/** このタグが付けられた記事の数 */
	articleCount: number;
	/** タグの翻訳データ */
	translations: {
		/** 日本語の翻訳 */
		ja: string;
		/** 英語の翻訳 */
		en: string;
	};
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
	/** 日本語のタグ名（1-100文字） */
	name: string;
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
	/** 日本語のタグ名（1-100文字） */
	name: string;
	/** 英語のタグ名（1-100文字、オプショナル。未指定の場合は自動翻訳） */
	enName?: string;
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

/**
 * タグ削除APIのレスポンス
 */
export interface TagDeleteResponse {
	/** 成功メッセージ */
	message: string;
}
