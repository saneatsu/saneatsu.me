import { describe, expect, it } from "vitest";

import { isActivePath } from "./is-active-path";

describe("isActivePath", () => {
	describe("Unit Test", () => {
		describe("ホームページ（path = '/'）", () => {
			it("pathnameが'/'のときtrueを返す", () => {
				// Given: ホームページにいる
				const pathname = "/";
				const path = "/";

				// When: ホームパスでアクティブ判定する
				const result = isActivePath(pathname, path);

				// Then: アクティブと判定される
				expect(result).toBe(true);
			});

			it("pathnameがサブページのときfalseを返す", () => {
				// Given: ブログページにいる
				const pathname = "/blog";
				const path = "/";

				// When: ホームパスでアクティブ判定する
				const result = isActivePath(pathname, path);

				// Then: アクティブではない
				expect(result).toBe(false);
			});

			it("pathnameが深いネストのページのときfalseを返す", () => {
				// Given: ブログ記事ページにいる
				const pathname = "/blog/some-post";
				const path = "/";

				// When: ホームパスでアクティブ判定する
				const result = isActivePath(pathname, path);

				// Then: アクティブではない
				expect(result).toBe(false);
			});
		});

		describe("一般ページ（path != '/'）", () => {
			it("pathnameとpathが完全一致するときtrueを返す", () => {
				// Given: コンタクトページにいる
				const pathname = "/contact";
				const path = "/contact";

				// When: コンタクトパスでアクティブ判定する
				const result = isActivePath(pathname, path);

				// Then: アクティブと判定される
				expect(result).toBe(true);
			});

			it("pathnameがpathのサブページのとき前方一致でtrueを返す", () => {
				// Given: ブログ記事ページにいる
				const pathname = "/blog/some-post";
				const path = "/blog";

				// When: ブログパスでアクティブ判定する
				const result = isActivePath(pathname, path);

				// Then: 前方一致でアクティブと判定される
				expect(result).toBe(true);
			});

			it("pathnameとpathが一致しないときfalseを返す", () => {
				// Given: アバウトページにいる
				const pathname = "/about";
				const path = "/contact";

				// When: コンタクトパスでアクティブ判定する
				const result = isActivePath(pathname, path);

				// Then: アクティブではない
				expect(result).toBe(false);
			});

			it("pathnameがルートでpathがサブページのときfalseを返す", () => {
				// Given: ホームページにいる
				const pathname = "/";
				const path = "/blog";

				// When: ブログパスでアクティブ判定する
				const result = isActivePath(pathname, path);

				// Then: アクティブではない
				expect(result).toBe(false);
			});

			it("深いネストのサブページでも前方一致でtrueを返す", () => {
				// Given: 深いネストのページにいる
				const pathname = "/blog/2024/01/some-post";
				const path = "/blog";

				// When: ブログパスでアクティブ判定する
				const result = isActivePath(pathname, path);

				// Then: 前方一致でアクティブと判定される
				expect(result).toBe(true);
			});
		});
	});
});
