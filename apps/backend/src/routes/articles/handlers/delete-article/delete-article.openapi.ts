import { createRoute, z } from "@hono/zod-openapi";

/**
 * 記事削除レスポンススキーマ
 */
const ArticleDeleteResponseSchema = z.object({
	message: z.string().openapi({
		example: "記事が正常に削除されました",
		description: "削除成功メッセージ",
	}),
});

/**
 * エラースキーマ
 */
const ErrorSchema = z.object({
	error: z.object({
		code: z.string().openapi({
			example: "NOT_FOUND",
			description: "エラーコード",
		}),
		message: z.string().openapi({
			example: "記事が見つかりません",
			description: "エラーメッセージ",
		}),
	}),
});

/**
 * 記事削除のルート定義
 *
 * @description
 * DELETE /articles/:id - 記事を削除
 *
 * 処理フロー:
 * 1. パスパラメータから記事IDを取得
 * 2. DBクライアントを作成
 * 3. 記事を取得
 * 4. 記事が存在しない場合は404エラー
 * 5. サムネイル画像（cfImageId）を削除
 * 6. Markdown内の画像を抽出して削除
 * 7. DBから記事を削除
 * 8. レスポンスを返す
 */
export const deleteArticleRoute = createRoute({
	method: "delete",
	path: "/{id}",
	request: {
		params: z.object({
			id: z
				.string()
				.regex(/^\d+$/)
				.openapi({
					param: {
						name: "id",
						in: "path",
					},
					example: "1",
					description: "記事ID",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ArticleDeleteResponseSchema,
				},
			},
			description: "記事削除成功",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "記事が見つかりません",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Articles"],
	summary: "記事削除",
	description:
		"記事を削除します。サムネイル画像とMarkdown内の画像も自動的に削除されます。",
});
