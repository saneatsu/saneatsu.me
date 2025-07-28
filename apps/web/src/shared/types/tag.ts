/**
 * タグ関連の共通型定義
 */

/**
 * タグの基本情報
 */
export interface Tag {
	/** タグID */
	id: number;
	/** タグスラッグ */
	slug: string;
	/** タグ名 */
	name: string;
	/** そのタグを持つ記事数 */
	articleCount: number;
}

/**
 * 記事詳細で使用するタグ情報
 * バックエンドのArticleTagSchemaに対応
 */
export interface ArticleTag {
	/** タグID */
	id: number;
	/** タグスラッグ */
	slug: string;
	/** タグ名（現在の言語での名前） */
	name: string;
}

/**
 * タグ一覧のAPIレスポンス
 */
export interface TagsResponse {
	data: Tag[];
}

/**
 * タグ一覧取得のクエリパラメータ
 */
export interface TagsQuery {
	/** 言語 */
	lang?: "ja" | "en";
}

/**
 * タグ選択用のオプション型
 */
export interface TagOption {
	/** オプションの値（タグID） */
	value: string;
	/** 表示ラベル（タグ名） */
	label: string;
	/** 無効フラグ */
	disabled?: boolean;
}
