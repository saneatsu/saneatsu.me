import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupDbMocks } from "../../utils/drizzle-test";
import {
	createMockArticleWithTranslation,
	createMockTag,
	createMockTagTranslation,
} from "../../utils/vitest";
import { tagsRoute } from "./index";

// モックの設定
vi.mock("@saneatsu/db", () => ({
	db: {
		select: vi.fn(),
	},
	tags: {},
	tagTranslations: {},
	articles: {},
	articleTranslations: {},
	articleTags: {},
}));

/**
 * タグと翻訳を組み合わせたモックデータを作成するヘルパー
 */
const createMockTagWithTranslation = (
	overrides: {
		tag?: Parameters<typeof createMockTag>[0];
		translation?: Parameters<typeof createMockTagTranslation>[0];
		combined?: Partial<{
			id: string;
			slug: string;
			name: string;
			articleCount: number;
		}>;
	} = {}
) => {
	const tag = createMockTag(overrides.tag);
	const translation = createMockTagTranslation({
		tagId: tag.id,
		...overrides.translation,
	});

	return {
		...tag,
		name: translation.name,
		articleCount: 0,
		...overrides.combined,
	};
};

describe("GET /tags", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("タグ一覧を正常に取得する", async () => {
		// Arrange
		const mockTags = [
			createMockTagWithTranslation({
				tag: {
					id: "tag1",
					slug: "javascript",
				},
				translation: {
					name: "JavaScript",
				},
				combined: {
					articleCount: 5,
				},
			}),
			createMockTagWithTranslation({
				tag: {
					id: "tag2",
					slug: "react",
				},
				translation: {
					name: "React",
				},
				combined: {
					articleCount: 3,
				},
			}),
		];

		const { mockDb } = setupDbMocks();

		const tagListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							groupBy: vi.fn().mockResolvedValue(mockTags),
						}),
					}),
				}),
			}),
		};

		mockDb.select.mockReturnValue(tagListMock);

		// Act
		const res = await (testClient(tagsRoute) as any).$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: mockTags,
		});
	});

	it("言語フィルタリング機能が正常に動作する", async () => {
		// Arrange
		const mockTags = [
			createMockTagWithTranslation({
				tag: {
					id: "tag1",
					slug: "javascript",
				},
				translation: {
					language: "en",
					name: "JavaScript",
				},
				combined: {
					articleCount: 5,
				},
			}),
		];

		const { mockDb } = setupDbMocks();

		const tagListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							groupBy: vi.fn().mockResolvedValue(mockTags),
						}),
					}),
				}),
			}),
		};

		mockDb.select.mockReturnValue(tagListMock);

		// Act
		const res = await (testClient(tagsRoute) as any).$get({
			query: {
				lang: "en",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data).toHaveLength(1);
		expect(data.data[0].name).toBe("JavaScript");
	});

	it("タグが存在しない場合、空の配列を返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		const tagListMock = {
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							groupBy: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
			}),
		};

		mockDb.select.mockReturnValue(tagListMock);

		// Act
		const res = await (testClient(tagsRoute) as any).$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: [],
		});
	});
});

describe("GET /tags/:slug/articles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("タグ別記事一覧を正常に取得する", async () => {
		// Arrange
		const mockTag = [{ id: "tag1" }];
		const mockArticles = [
			createMockArticleWithTranslation({
				article: {
					id: "article1",
					slug: "test-article-1",
					status: "published",
				},
				translation: {
					title: "JavaScript入門",
					content: "JavaScriptの基礎を学ぼう。",
				},
			}),
			createMockArticleWithTranslation({
				article: {
					id: "article2",
					slug: "test-article-2",
					status: "published",
				},
				translation: {
					title: "React入門",
					content: "Reactの基礎を学ぼう。",
				},
			}),
		];

		const mockTotalCount = [{ count: 2 }];

		const { mockDb } = setupDbMocks();

		// タグ取得のモック
		const tagMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue(mockTag),
				}),
			}),
		};

		// 記事一覧取得のモック
		const articleListMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockReturnValue({
								offset: vi.fn().mockResolvedValue(mockArticles),
							}),
						}),
					}),
				}),
			}),
		};

		// 総記事数取得のモック
		const countMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTotalCount),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(tagMock) // タグ取得
			.mockReturnValueOnce(articleListMock) // 記事一覧取得
			.mockReturnValueOnce(countMock); // 総記事数取得

		// Act
		const res = await (testClient(tagsRoute) as any).javascript.articles.$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: mockArticles,
			pagination: {
				page: 1,
				limit: 10,
				total: 2,
				totalPages: 1,
			},
		});
	});

	it("存在しないタグスラッグの場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		const tagMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]), // 空の配列 = タグが見つからない
				}),
			}),
		};

		mockDb.select.mockReturnValue(tagMock);

		// Act
		const res = await (testClient(tagsRoute) as any)[
			"non-existent-tag"
		].articles.$get({
			query: {},
		});

		// Assert
		expect(res.status).toBe(404);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "NOT_FOUND",
				message: "Tag not found",
			},
		});
	});

	it("ページネーション機能が正常に動作する", async () => {
		// Arrange
		const mockTag = [{ id: "tag1" }];
		const mockArticles = [
			createMockArticleWithTranslation({
				article: { id: "article3", slug: "test-article-3" },
			}),
		];

		const mockTotalCount = [{ count: 25 }];

		const { mockDb } = setupDbMocks();

		const tagMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue(mockTag),
				}),
			}),
		};

		const articleListMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockReturnValue({
								offset: vi.fn().mockResolvedValue(mockArticles),
							}),
						}),
					}),
				}),
			}),
		};

		const countMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTotalCount),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(tagMock)
			.mockReturnValueOnce(articleListMock)
			.mockReturnValueOnce(countMock);

		// Act
		const res = await (testClient(tagsRoute) as any).javascript.articles.$get({
			query: {
				page: "3",
				limit: "5",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.pagination).toEqual({
			page: 3,
			limit: 5,
			total: 25,
			totalPages: 5,
		});
	});

	it("言語指定でタグ別記事一覧を取得する", async () => {
		// Arrange
		const mockTag = [{ id: "tag1" }];
		const mockArticles = [
			createMockArticleWithTranslation({
				article: {
					id: "article1",
					slug: "test-article-1",
				},
				translation: {
					language: "en",
					title: "Introduction to JavaScript",
					content: "Learn the basics of JavaScript.",
				},
			}),
		];

		const mockTotalCount = [{ count: 1 }];

		const { mockDb } = setupDbMocks();

		const tagMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue(mockTag),
				}),
			}),
		};

		const articleListMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockReturnValue({
								offset: vi.fn().mockResolvedValue(mockArticles),
							}),
						}),
					}),
				}),
			}),
		};

		const countMock = {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockTotalCount),
				}),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(tagMock)
			.mockReturnValueOnce(articleListMock)
			.mockReturnValueOnce(countMock);

		// Act
		const res = await (testClient(tagsRoute) as any).javascript.articles.$get({
			query: {
				lang: "en",
			},
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.data).toHaveLength(1);
		expect(data.data[0].title).toBe("Introduction to JavaScript");
	});
});

describe("GET /tags/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("タグの詳細情報を正常に取得する", async () => {
		// Arrange
		const mockTag = { id: 1, slug: "javascript", createdAt: "2024-01-01", updatedAt: "2024-01-01" };
		const mockTranslations = [
			{ id: 1, name: "JavaScript", language: "ja", tagId: 1 },
			{ id: 2, name: "JavaScript", language: "en", tagId: 1 },
		];

		const { mockDb } = setupDbMocks();

		// タグ取得のモック
		const tagMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([mockTag]),
				}),
			}),
		};

		// 翻訳取得のモック
		const translationsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(mockTranslations),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(tagMock) // タグ取得
			.mockReturnValueOnce(translationsMock); // 翻訳取得

		// Act
		const res = await (testClient(tagsRoute) as any)["1"].$get();

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: {
				...mockTag,
				translations: mockTranslations,
			},
		});
	});

	it("存在しないタグの場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		const tagMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]), // 空の配列 = タグが見つからない
				}),
			}),
		};

		mockDb.select.mockReturnValue(tagMock);

		// Act
		const res = await (testClient(tagsRoute) as any)["999"].$get();

		// Assert
		expect(res.status).toBe(404);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "NOT_FOUND",
				message: "Tag not found",
			},
		});
	});
});

describe("POST /tags", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("新しいタグを正常に作成する", async () => {
		// Arrange
		const requestBody = {
			slug: "react",
			translations: [
				{ name: "React", language: "ja" },
				{ name: "React", language: "en" },
			],
		};

		const mockCreatedTag = { id: 1, slug: "react", createdAt: "2024-01-01", updatedAt: "2024-01-01" };
		const mockCreatedTranslations = [
			{ id: 1, name: "React", language: "ja", tagId: 1 },
			{ id: 2, name: "React", language: "en", tagId: 1 },
		];

		const { mockDb } = setupDbMocks();

		// スラッグ重複チェックのモック
		const slugCheckMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]), // 空の配列 = 重複なし
				}),
			}),
		};

		// トランザクションのモック
		const transactionMock = vi.fn().mockImplementation(async (callback) => {
			const txMock = {
				insert: vi.fn().mockReturnValue({
					values: vi.fn().mockReturnValue({
						returning: vi.fn()
							.mockResolvedValueOnce([mockCreatedTag]) // タグの作成
							.mockResolvedValueOnce(mockCreatedTranslations), // 翻訳の作成
					}),
				}),
			};
			return callback(txMock);
		});

		mockDb.select.mockReturnValue(slugCheckMock);
		mockDb.transaction = transactionMock;

		// Act
		const res = await (testClient(tagsRoute) as any).$post({
			json: requestBody,
		});

		// Assert
		expect(res.status).toBe(201);
		const data = await res.json();

		expect(data).toEqual({
			data: {
				...mockCreatedTag,
				translations: mockCreatedTranslations,
			},
		});
	});

	it("スラッグが重複している場合、409エラーを返す", async () => {
		// Arrange
		const requestBody = {
			slug: "javascript",
			translations: [
				{ name: "JavaScript", language: "ja" },
				{ name: "JavaScript", language: "en" },
			],
		};

		const { mockDb } = setupDbMocks();

		// スラッグ重複チェックのモック（既存のタグが見つかる）
		const slugCheckMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([{ id: 1, slug: "javascript" }]),
				}),
			}),
		};

		mockDb.select.mockReturnValue(slugCheckMock);

		// Act
		const res = await (testClient(tagsRoute) as any).$post({
			json: requestBody,
		});

		// Assert
		expect(res.status).toBe(409);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "DUPLICATE_SLUG",
				message: "Slug already exists",
			},
		});
	});
});

describe("PUT /tags/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("タグを正常に更新する", async () => {
		// Arrange
		const requestBody = {
			slug: "react-js",
			translations: [
				{ name: "React.js", language: "ja" },
				{ name: "React.js", language: "en" },
			],
		};

		const existingTag = { id: 1, slug: "react", createdAt: "2024-01-01", updatedAt: "2024-01-01" };
		const updatedTag = { ...existingTag, slug: "react-js", updatedAt: "2024-01-02" };
		const updatedTranslations = [
			{ id: 3, name: "React.js", language: "ja", tagId: 1 },
			{ id: 4, name: "React.js", language: "en", tagId: 1 },
		];

		const { mockDb } = setupDbMocks();

		// タグ存在確認のモック
		const tagExistsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([existingTag]),
				}),
			}),
		};

		// スラッグ重複チェックのモック
		const slugCheckMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]), // 重複なし
				}),
			}),
		};

		// トランザクションのモック
		const transactionMock = vi.fn().mockImplementation(async (callback) => {
			const txMock = {
				update: vi.fn().mockReturnValue({
					set: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(undefined),
					}),
				}),
				delete: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
				insert: vi.fn().mockReturnValue({
					values: vi.fn().mockResolvedValue(undefined),
				}),
				select: vi.fn()
					.mockReturnValueOnce({
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([updatedTag]),
							}),
						}),
					})
					.mockReturnValueOnce({
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue(updatedTranslations),
						}),
					}),
			};
			return callback(txMock);
		});

		mockDb.select
			.mockReturnValueOnce(tagExistsMock) // タグ存在確認
			.mockReturnValueOnce(slugCheckMock); // スラッグ重複チェック
		mockDb.transaction = transactionMock;

		// Act
		const res = await (testClient(tagsRoute) as any)["1"].$put({
			json: requestBody,
		});

		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toEqual({
			data: {
				...updatedTag,
				translations: updatedTranslations,
			},
		});
	});

	it("存在しないタグを更新しようとした場合、404エラーを返す", async () => {
		// Arrange
		const requestBody = {
			slug: "react-js",
			translations: [
				{ name: "React.js", language: "ja" },
				{ name: "React.js", language: "en" },
			],
		};

		const { mockDb } = setupDbMocks();

		// タグ存在確認のモック（タグが見つからない）
		const tagExistsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		};

		mockDb.select.mockReturnValue(tagExistsMock);

		// Act
		const res = await (testClient(tagsRoute) as any)["999"].$put({
			json: requestBody,
		});

		// Assert
		expect(res.status).toBe(404);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "NOT_FOUND",
				message: "Tag not found",
			},
		});
	});
});

describe("DELETE /tags/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("使用されていないタグを正常に削除する", async () => {
		// Arrange
		const existingTag = { id: 1, slug: "obsolete-tag" };

		const { mockDb } = setupDbMocks();

		// タグ存在確認のモック
		const tagExistsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([existingTag]),
				}),
			}),
		};

		// タグ使用状況チェックのモック（使用されていない）
		const tagUsageMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ count: 0 }]),
			}),
		};

		// 削除のモック
		const deleteMock = {
			where: vi.fn().mockResolvedValue(undefined),
		};

		mockDb.select
			.mockReturnValueOnce(tagExistsMock) // タグ存在確認
			.mockReturnValueOnce(tagUsageMock); // タグ使用状況チェック
		mockDb.delete = vi.fn().mockReturnValue(deleteMock);

		// Act
		const res = await (testClient(tagsRoute) as any)["1"].$delete();

		// Assert
		expect(res.status).toBe(204);
	});

	it("使用中のタグを削除しようとした場合、409エラーを返す", async () => {
		// Arrange
		const existingTag = { id: 1, slug: "javascript" };

		const { mockDb } = setupDbMocks();

		// タグ存在確認のモック
		const tagExistsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([existingTag]),
				}),
			}),
		};

		// タグ使用状況チェックのモック（5記事で使用中）
		const tagUsageMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ count: 5 }]),
			}),
		};

		mockDb.select
			.mockReturnValueOnce(tagExistsMock) // タグ存在確認
			.mockReturnValueOnce(tagUsageMock); // タグ使用状況チェック

		// Act
		const res = await (testClient(tagsRoute) as any)["1"].$delete();

		// Assert
		expect(res.status).toBe(409);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "TAG_IN_USE",
				message: "Cannot delete tag that is in use",
			},
		});
	});

	it("存在しないタグを削除しようとした場合、404エラーを返す", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// タグ存在確認のモック（タグが見つからない）
		const tagExistsMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		};

		mockDb.select.mockReturnValue(tagExistsMock);

		// Act
		const res = await (testClient(tagsRoute) as any)["999"].$delete();

		// Assert
		expect(res.status).toBe(404);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "NOT_FOUND",
				message: "Tag not found",
			},
		});
	});
});
