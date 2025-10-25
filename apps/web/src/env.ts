import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Next.js環境変数の型安全な定義
 *
 * @description
 * t3-envを使用して環境変数を型安全に管理する。
 * 環境変数が正しく設定されていない場合、ビルド時またはランタイム時にエラーを投げる。
 *
 * 使用方法:
 * ```tsx
 * import { env } from "@/env";
 *
 * const apiUrl = env.NEXT_PUBLIC_API_URL;
 * const accountHash = env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
 * ```
 */
export const env = createEnv({
	/**
	 * サーバーサイドの環境変数
	 * これらは `NEXT_PUBLIC_` プレフィックスを持たず、クライアントからはアクセスできない
	 */
	server: {},

	/**
	 * クライアントサイドの環境変数
	 * これらは `NEXT_PUBLIC_` プレフィックスを持ち、ブラウザでアクセス可能
	 */
	client: {
		/**
		 * APIのベースURL
		 * 例: "http://localhost:8080" または "https://api.saneatsu.me"
		 */
		NEXT_PUBLIC_API_URL: z.url(),

		/**
		 * Cloudflare Imagesのアカウントハッシュ
		 * 画像配信URLの生成に使用される
		 */
		NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH: z.string().min(1),
	},

	/**
	 * 実際の環境変数とのマッピング
	 * Next.jsでは `process.env` が自動的に静的に置換されるため、
	 * ここで明示的にマッピングする必要がある
	 */
	runtimeEnv: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH:
			process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH,
	},

	/**
	 * エラーメッセージをより詳細にする（開発時のみ推奨）
	 */
	emptyStringAsUndefined: true,
});
