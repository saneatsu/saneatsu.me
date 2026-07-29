import type { InferResponseType } from "hono/client";

import type { ApiClient } from "@/shared/lib/hono/client-type";

/**
 * タグ一覧APIのレスポンス（バックエンドの契約から導出）
 */
export type TagsResponse = InferResponseType<
	ApiClient["api"]["tags"]["$get"],
	200
>;

/**
 * タグオブジェクト（一覧レスポンスの要素から導出）
 */
export type Tag = TagsResponse["data"][number];

/**
 * タグ作成リクエストボディ
 */
export interface TagCreateRequest {
	/** 日本語のタグ名（1-100文字） */
	name: string;
	/** タグのスラッグ（小文字英数字で始まり、単語をハイフンで区切る形式、1-100文字） */
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
	/** スペイン語のタグ名（1-100文字、オプショナル。未指定の場合は自動翻訳） */
	esName?: string;
	/** タグのスラッグ（小文字英数字で始まり、単語をハイフンで区切る形式、1-100文字） */
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
