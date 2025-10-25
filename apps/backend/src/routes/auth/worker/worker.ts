import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Env } from "@/env";
import { createDbClient } from "../../../lib/db";
import {
	AuthErrorSchema,
	UpsertUserSchema,
	UserResponseSchema,
} from "../schema";
import {
	getUserByEmail,
	isAdminEmail,
	upsertUserFromGoogle,
} from "../service/service";

export const authRoute = new OpenAPIHono<{ Bindings: Env }>();

/**
 * ユーザー作成/更新エンドポイント
 *
 * @description
 * Google認証後にユーザー情報を作成または更新する
 * 管理者権限のチェックも行う
 */
const upsertUserRoute = createRoute({
	method: "post",
	path: "/user",
	request: {
		body: {
			content: {
				"application/json": {
					schema: UpsertUserSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UserResponseSchema,
				},
			},
			description: "ユーザー情報の作成/更新に成功",
		},
		403: {
			content: {
				"application/json": {
					schema: AuthErrorSchema,
				},
			},
			description: "管理者権限がない",
		},
		500: {
			content: {
				"application/json": {
					schema: AuthErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Auth"],
	summary: "ユーザー情報の作成/更新",
});

authRoute.openapi(upsertUserRoute, async (c) => {
	try {
		const profile = c.req.valid("json");
		const adminEmails = c.env.ADMIN_EMAILS || "";

		// デバッグログ
		console.log("🔍 Backend auth debug:", {
			email: profile.email,
			adminEmails: adminEmails,
			envKeys: Object.keys(c.env),
			hasAdminEmails: !!c.env.ADMIN_EMAILS,
		});

		// 管理者権限チェック
		if (!isAdminEmail(profile.email, adminEmails)) {
			console.log("❌ Admin check failed:", {
				email: profile.email,
				adminEmails: adminEmails,
				isAdmin: false,
			});
			return c.json(
				{
					error: {
						code: "FORBIDDEN" as const,
						message: "管理者権限がありません",
					},
				},
				403
			);
		}

		// データベース接続
		const db = createDbClient(c.env);

		// ユーザーの作成/更新
		const user = await upsertUserFromGoogle(db, profile);

		// レスポンスの構築
		return c.json(
			{
				...user,
				isAdmin: true, // 管理者チェックを通過しているため
			},
			200
		);
	} catch (error) {
		console.error("Error upserting user:", error);
		return c.json(
			{
				error: {
					code: "UNAUTHORIZED" as const,
					message: "ユーザー情報の処理に失敗しました",
				},
			},
			500
		);
	}
});

/**
 * ユーザー情報取得エンドポイント
 *
 * @description
 * メールアドレスからユーザー情報を取得する
 */
const getUserRoute = createRoute({
	method: "get",
	path: "/user/:email",
	request: {
		params: z.object({
			email: z.string().email(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UserResponseSchema,
				},
			},
			description: "ユーザー情報の取得に成功",
		},
		404: {
			content: {
				"application/json": {
					schema: AuthErrorSchema,
				},
			},
			description: "ユーザーが見つからない",
		},
		500: {
			content: {
				"application/json": {
					schema: AuthErrorSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Auth"],
	summary: "ユーザー情報の取得",
});

authRoute.openapi(getUserRoute, async (c) => {
	try {
		const { email } = c.req.valid("param");
		const adminEmails = c.env.ADMIN_EMAILS || "";

		// データベース接続
		const db = createDbClient(c.env);

		// ユーザー情報取得
		const user = await getUserByEmail(db, email);

		if (!user) {
			return c.json(
				{
					error: {
						code: "USER_NOT_FOUND" as const,
						message: "ユーザーが見つかりません",
					},
				},
				404
			);
		}

		// レスポンスの構築
		return c.json(
			{
				...user,
				isAdmin: isAdminEmail(user.email, adminEmails),
			},
			200
		);
	} catch (error) {
		console.error("Error getting user:", error);
		return c.json(
			{
				error: {
					code: "UNAUTHORIZED" as const,
					message: "ユーザー情報の取得に失敗しました",
				},
			},
			500
		);
	}
});
