import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * 環境変数の型安全な定義（開発環境用）
 *
 * @description
 * @t3-oss/env-coreを使用して環境変数を型安全に管理する。
 * 環境変数が正しく設定されていない場合、起動時にエラーを投げる。
 *
 * 使用方法:
 * ```typescript
 * // dev.ts（開発環境）でのみインポート
 * import { env } from "@/env";
 * // これでバリデーションが実行される
 * ```
 *
 * 注意:
 * - このファイルは開発環境（Node.js）でのみ使用される
 * - Cloudflare Workers本番環境では、wrangler.tomlで環境変数を設定する
 * - 各ハンドラーでは `c.env` を使って環境変数にアクセスする
 */
export const env = createEnv({
	/**
	 * サーバーサイドの環境変数
	 */
	server: {
		/**
		 * 環境名
		 * - development: ローカル開発環境
		 * - preview: プレビュー環境
		 * - production: 本番環境
		 */
		NODE_ENV: z.enum(["development", "preview", "production"]),

		/**
		 * Turso Database URL
		 */
		TURSO_DATABASE_URL: z.string().min(1),

		/**
		 * Turso認証トークン
		 * ローカル開発では不要（file: URLを使用する場合）
		 */
		TURSO_AUTH_TOKEN: z.string().optional(),

		/**
		 * Cloudflare Account ID
		 */
		CLOUDFLARE_ACCOUNT_ID: z.string().min(1),

		/**
		 * Cloudflare Account Hash（画像配信URL用）
		 */
		CLOUDFLARE_ACCOUNT_HASH: z.string().min(1),

		/**
		 * Cloudflare API Token
		 */
		CLOUDFLARE_API_TOKEN: z.string().min(1),

		/**
		 * Gemini API Key（オプショナル）
		 */
		GEMINI_API_KEY: z.string().optional(),

		/**
		 * CORS許可オリジン（オプショナル）
		 */
		CORS_ORIGIN: z.string().optional(),

		/**
		 * 管理者メールアドレス（カンマ区切り）（オプショナル）
		 */
		ADMIN_EMAILS: z.string().optional(),
	},

	/**
	 * 実際の環境変数とのマッピング
	 */
	runtimeEnv: process.env,

	/**
	 * 空文字列をundefinedとして扱う
	 */
	emptyStringAsUndefined: true,
});
