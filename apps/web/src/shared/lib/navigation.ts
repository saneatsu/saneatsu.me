import { createNavigation } from "next-intl/navigation";

import { routing } from "../config/routing";

/**
 * next-intl ナビゲーションAPI
 *
 * @description
 * next-intl の createNavigation を使用して、ロケール対応のナビゲーション機能を提供する。
 *
 * routing 設定（defineRouting）をインポートし、それを基にナビゲーションAPIを作成する。
 * これにより、middlewareとナビゲーションAPIで同じルーティング設定を共有できる。
 *
 * Link, redirect, usePathname, useRouter は自動的に現在のロケールを保持し、
 * href="/blog" のような相対パスを指定すると、自動的に /${locale}/blog に変換される。
 *
 * @example
 * ```tsx
 * import { Link } from '@/shared/lib/navigation';
 *
 * // 自動的に現在のロケールが保持される
 * <Link href="/blog">Blog</Link>
 * // /ja にいる場合 → /ja/blog
 * // /en にいる場合 → /en/blog
 * ```
 */
export const { Link, redirect, usePathname, useRouter } =
	createNavigation(routing);
