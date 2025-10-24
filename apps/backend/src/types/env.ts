/**
 * Cloudflare Workers環境変数の型定義
 *
 * @description
 * すべてのAPIハンドラーとルートで使用される環境変数の型を定義する。
 * 各フィールドはCloudflare Workers環境で利用可能な環境変数を表す。
 */
export type Env = {
	/** Turso Database URL */
	TURSO_DATABASE_URL: string;

	/** Turso認証トークン */
	TURSO_AUTH_TOKEN: string;

	/** Gemini API Key（オプショナル） */
	GEMINI_API_KEY?: string;

	/** 環境名（development, production等）（オプショナル） */
	ENVIRONMENT?: string;

	/** CORS許可オリジン */
	CORS_ORIGIN?: string;

	/** 管理者メールアドレス（カンマ区切り）（オプショナル） */
	ADMIN_EMAILS?: string;

	/** Cloudflare Account ID */
	CLOUDFLARE_ACCOUNT_ID: string;

	/** Cloudflare Account Hash（画像配信URL用） */
	CLOUDFLARE_ACCOUNT_HASH: string;

	/** Cloudflare Images API Token */
	CLOUDFLARE_IMAGES_TOKEN: string;
};
