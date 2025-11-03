/**
 * 共通型定義
 */

/**
 * ページネーション情報
 */
export interface PaginationInfo {
	/** 現在のページ番号 */
	page: number;
	/** 1ページあたりのアイテム数 */
	limit: number;
	/** 総アイテム数 */
	total: number;
	/** 総ページ数 */
	totalPages: number;
}

/**
 * ページネーション付きレスポンス（汎用）
 */
export interface PaginatedResponse<T> {
	/** データの配列 */
	data: T[];
	/** ページネーション情報 */
	pagination: PaginationInfo;
}

/**
 * エラーレスポンス
 */
export interface ApiError {
	error: {
		/** エラーコード */
		code: string;
		/** エラーメッセージ */
		message: string;
	};
}
