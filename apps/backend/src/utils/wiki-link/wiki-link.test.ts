import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	convertWikiLinks,
	extractWikiLinks,
	fetchArticleInfoBySlugs,
} from "./wiki-link";

// Drizzle ORMのモックを設定
vi.mock("@saneatsu/db", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => []),
				})),
			})),
		})),
	},
	articles: {},
	articleTranslations: {},
}));

describe("wiki-link utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Unit Test", () => {
		describe("extractWikiLinks", () => {
			it("should extract wiki links from content", () => {
				const content = `
これは記事です。[[my-article]]を参照してください。
また、[[another-article]]と[[third-article]]も確認してください。
				`;

				const links = extractWikiLinks(content);

				expect(links).toEqual([
					"my-article",
					"another-article",
					"third-article",
				]);
			});

			it("should handle duplicate wiki links", () => {
				const content = `
[[duplicate-article]]を参照。
もう一度[[duplicate-article]]を参照。
				`;

				const links = extractWikiLinks(content);

				expect(links).toEqual(["duplicate-article"]);
			});

			it("should return empty array when no wiki links found", () => {
				const content = "これは通常のMarkdownテキストです。";

				const links = extractWikiLinks(content);

				expect(links).toEqual([]);
			});

			it("should only extract valid slug patterns", () => {
				const content = `
[[valid-slug-123]]は有効です。
[[Invalid Slug]]は無効です（スペース含む）。
[[UPPERCASE]]は無効です（大文字）。
[[日本語]]は無効です。
[[valid-2]]は有効です。
				`;

				const links = extractWikiLinks(content);

				expect(links).toEqual(["valid-slug-123", "valid-2"]);
			});
		});
	});

	describe("Integration Test", () => {
		describe("fetchArticleInfoBySlugs", () => {
			it("should fetch article info for given slugs", async () => {
				const mockDb = await import("@saneatsu/db");
				const mockSelect = vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([
								{
									slug: "article-1",
									title: "記事1のタイトル",
									status: "published",
								},
								{
									slug: "article-2",
									title: "記事2のタイトル",
									status: "published",
								},
							]),
						}),
					}),
				});
				// @ts-ignore
				mockDb.db.select = mockSelect;

				const result = await fetchArticleInfoBySlugs(
					mockDb.db,
					["article-1", "article-2"],
					"ja"
				);

				expect(result.size).toBe(2);
				expect(result.get("article-1")).toEqual({
					slug: "article-1",
					title: "記事1のタイトル",
					url: "/ja/blog/article-1",
				});
				expect(result.get("article-2")).toEqual({
					slug: "article-2",
					title: "記事2のタイトル",
					url: "/ja/blog/article-2",
				});
			});

			it("should handle non-existent articles", async () => {
				const mockDb = await import("@saneatsu/db");
				const mockSelect = vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([
								{
									slug: "existing-article",
									title: "存在する記事",
									status: "published",
								},
							]),
						}),
					}),
				});
				// @ts-ignore
				mockDb.db.select = mockSelect;

				const result = await fetchArticleInfoBySlugs(
					mockDb.db,
					["existing-article", "non-existent-article"],
					"ja"
				);

				expect(result.size).toBe(2);
				expect(result.get("existing-article")).toEqual({
					slug: "existing-article",
					title: "存在する記事",
					url: "/ja/blog/existing-article",
				});
				expect(result.get("non-existent-article")).toEqual({
					slug: "non-existent-article",
					title: null,
					url: "/ja/blog/non-existent-article",
				});
			});

			it("should handle unpublished articles", async () => {
				const mockDb = await import("@saneatsu/db");
				const mockSelect = vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([
								{
									slug: "draft-article",
									title: "下書き記事",
									status: "draft",
								},
							]),
						}),
					}),
				});
				// @ts-ignore
				mockDb.db.select = mockSelect;

				const result = await fetchArticleInfoBySlugs(
					mockDb.db,
					["draft-article"],
					"ja"
				);

				expect(result.size).toBe(1);
				expect(result.get("draft-article")).toEqual({
					slug: "draft-article",
					title: null,
					url: "/ja/blog/draft-article",
				});
			});

			it("should return empty map for empty slug array", async () => {
				// 空配列の場合はDBアクセスしないが、型の整合性のためmockDbを渡す
				const mockDb = {} as any;
				const result = await fetchArticleInfoBySlugs(mockDb, [], "ja");

				expect(result.size).toBe(0);
			});
		});

		describe("convertWikiLinks", () => {
			it("should convert wiki links to markdown links", async () => {
				const mockDb = await import("@saneatsu/db");
				const mockSelect = vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([
								{
									slug: "article-1",
									title: "記事1のタイトル",
									status: "published",
								},
								{
									slug: "article-2",
									title: "記事2のタイトル",
									status: "published",
								},
							]),
						}),
					}),
				});
				// @ts-ignore
				mockDb.db.select = mockSelect;

				const content = `
# メインタイトル

この記事では[[article-1]]について説明します。
詳細は[[article-2]]を参照してください。
				`;

				const converted = await convertWikiLinks(mockDb.db, content, "ja");

				expect(converted).toContain(
					"[記事1のタイトル](/ja/blog/article-1)"
				);
				expect(converted).toContain(
					"[記事2のタイトル](/ja/blog/article-2)"
				);
				expect(converted).not.toContain("[[article-1]]");
				expect(converted).not.toContain("[[article-2]]");
			});

			it("should keep wiki links for non-existent articles", async () => {
				const mockDb = await import("@saneatsu/db");
				const mockSelect = vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([]),
						}),
					}),
				});
				// @ts-ignore
				mockDb.db.select = mockSelect;

				const content = "この記事では[[non-existent]]について説明します。";

				const converted = await convertWikiLinks(mockDb.db, content, "ja");

				expect(converted).toBe(content); // 変換されない
			});

			it("should handle mixed existing and non-existing articles", async () => {
				const mockDb = await import("@saneatsu/db");
				const mockSelect = vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([
								{
									slug: "existing",
									title: "存在する記事",
									status: "published",
								},
							]),
						}),
					}),
				});
				// @ts-ignore
				mockDb.db.select = mockSelect;

				const content = `
[[existing]]は変換されます。
[[non-existing]]は変換されません。
				`;

				const converted = await convertWikiLinks(mockDb.db, content, "ja");

				expect(converted).toContain("[存在する記事](/ja/blog/existing)");
				expect(converted).toContain("[[non-existing]]");
			});

			it("should return original content when no wiki links found", async () => {
				const content = "これは通常のMarkdownテキストです。";
				// Wiki linkがない場合はDBアクセスしないが、型の整合性のためmockDbを渡す
				const mockDb = {} as any;

				const converted = await convertWikiLinks(mockDb, content, "ja");

				expect(converted).toBe(content);
			});

			it("should handle multiple occurrences of same wiki link", async () => {
				const mockDb = await import("@saneatsu/db");
				const mockSelect = vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([
								{
									slug: "repeated",
									title: "繰り返し記事",
									status: "published",
								},
							]),
						}),
					}),
				});
				// @ts-ignore
				mockDb.db.select = mockSelect;

				const content = `
最初の[[repeated]]です。
二回目の[[repeated]]です。
				`;

				const converted = await convertWikiLinks(mockDb.db, content, "ja");

				expect(converted).not.toContain("[[repeated]]");
				expect(converted.match(/繰り返し記事/g)).toHaveLength(2);
			});
		});
	});
});
