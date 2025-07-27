/**
 * 管理者設定
 */

/**
 * 管理者として許可されているメールアドレスのリスト
 *
 * @description
 * 環境変数ADMIN_EMAILSから読み込む（カンマ区切り）
 * 設定されていない場合はデフォルト値を使用
 *
 * 例: ADMIN_EMAILS="admin1@gmail.com,admin2@gmail.com"
 */
export const ALLOWED_ADMIN_EMAILS: readonly string[] = (() => {
	const envEmails = process.env.ADMIN_EMAILS;
	if (envEmails) {
		return envEmails.split(",").map((email) => email.trim());
	}
	// デフォルト値（開発用）
	return ["admin@example.com"];
})();

/**
 * メールアドレスが管理者として許可されているかチェック
 *
 * @param email - チェックするメールアドレス
 * @returns 管理者として許可されているかどうか
 */
export function isAdminEmail(email: string): boolean {
	return ALLOWED_ADMIN_EMAILS.includes(
		email as (typeof ALLOWED_ADMIN_EMAILS)[number]
	);
}
