import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * データベース関連スクリプト用の環境変数スキーマ
 *
 * @description
 * @t3-oss/env-coreを利用してTurso接続情報を型安全に扱う。
 * SeedやBackfillなどのNode.jsスクリプトから共有する。
 */
export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "preview", "production", "test"])
			.optional(),
		TURSO_DATABASE_URL: z
			.string()
			.min(1, "TURSO_DATABASE_URLは必須です")
			.optional(),
		TURSO_AUTH_TOKEN: z.string().optional(),
	},
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
		TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
	},
	emptyStringAsUndefined: true,
});

export type DbEnv = typeof env;
