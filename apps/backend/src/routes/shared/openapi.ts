import { z } from "@hono/zod-openapi";

/**
 * 共通エラーレスポンススキーマ
 *
 * @description
 * 全ルートで同一形状の `{ error: { code, message } }` を返すため、ここで一度だけ定義する。
 * 各ハンドラで個別に再定義していたものを共通化したもの。
 */
export const errorSchema = z.object({
	error: z.object({
		code: z.string().openapi({
			example: "NOT_FOUND",
			description: "エラーコード",
		}),
		message: z.string().openapi({
			example: "リソースが見つかりません",
			description: "エラーメッセージ",
		}),
	}),
});
