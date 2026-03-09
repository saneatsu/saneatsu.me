/**
 * 指定されたパスが現在のパスに対してアクティブかどうかを判定する
 *
 * next-intl の usePathname はロケールプレフィックスを含まないパスを返すため、
 * pathname と path を直接比較する。
 *
 * 1. ホームページ（"/"）の場合は完全一致で判定
 * 2. その他のページは前方一致で判定（サブページも含む）
 *
 * @param pathname - 現在のパス（ロケールプレフィックスなし、例: "/", "/blog", "/contact"）
 * @param path - 判定対象のパス（例: "/", "/blog"）
 */
export function isActivePath(pathname: string, path: string): boolean {
	if (path === "/") {
		// ホームページの場合は完全一致
		return pathname === "/";
	}
	// その他のページは前方一致（サブページも含む）
	return pathname.startsWith(path);
}
