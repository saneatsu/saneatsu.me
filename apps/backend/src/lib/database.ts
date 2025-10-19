/**
 * データベース接続ヘルパー
 *
 * @description
 * Node.js環境とCloudflare Workers環境の両方で動作する統合データベースヘルパー。
 * 環境を自動判定して適切なデータベースモジュールをインポートする。
 */

/**
 * 環境に応じて適切なデータベースモジュールを取得
 *
 * @description
 * - Node.js環境: @saneatsu/db を使用（file: スキームをサポート）
 * - Cloudflare Workers環境: @saneatsu/db/worker を使用（libsql:, https: スキームのみ）
 *
 * @returns データベースモジュール（createDatabaseClient関数とスキーマを含む）
 */
export async function getDatabase() {
	const isNodeEnv = typeof process !== "undefined" && process.versions?.node;
	return isNodeEnv
		? await import("@saneatsu/db")
		: await import("@saneatsu/db/worker");
}
