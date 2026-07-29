import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { tagsRoute } from "@/routes/tags";
import { setupDbMocks } from "@/utils/drizzle-test";

// 翻訳サービスのモック
// TARGET_LANGUAGES は create-tag が翻訳対象の列挙に使う実データなので、
// importOriginal で本物を残したまま createTranslationService だけ差し替える。
const mockTranslateTag = vi.fn();
vi.mock(
	"@/services/gemini-translation/gemini-translation",
	async (importOriginal) => ({
		...(await importOriginal<
			typeof import("@/services/gemini-translation/gemini-translation")
		>()),
		createTranslationService: vi.fn(() => ({
			translateTag: mockTranslateTag,
		})),
	})
);

// 自動翻訳（translateWithGemini）のモック
const mockTranslateWithGemini = vi.fn();
vi.mock("@/lib/translate", () => ({
	translateWithGemini: (...args: unknown[]) => mockTranslateWithGemini(...args),
}));

// getDatabase関数のモック
vi.mock("@/lib/database", () => ({
	getDatabase: vi.fn(),
}));

describe("POST /tags - タグ作成", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("タグを正常に作成する", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// getDatabase関数がmockDbとスキーマを返すように設定
		const { getDatabase } = await import("@/lib/database");
		(getDatabase as any).mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue(mockDb),
			tags: {},
			tagTranslations: {},
		});

		const mockNewTag = {
			id: 1,
			slug: "typescript",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		// Insertタグのモック
		const insertTagMock = {
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockNewTag]),
			}),
		};

		// Insert tag_translation のモック
		const insertTranslationMock = {
			values: vi.fn().mockResolvedValue(undefined),
		};

		// 既存タグチェック用のモック
		const checkExistingMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]), // 既存タグなし
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(checkExistingMock); // 既存タグチェック
		mockDb.insert
			.mockReturnValueOnce(insertTagMock) // タグ作成
			.mockReturnValueOnce(insertTranslationMock); // 日本語翻訳（GEMINI_API_KEYがないので英語翻訳はスキップ）

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(201);
		const data = await res.json();

		expect(data).toEqual({
			data: mockNewTag,
			message: "タグが正常に作成されました",
		});

		expect(mockDb.insert).toHaveBeenCalledTimes(2); // tag + ja translation
		expect(mockDb.select).toHaveBeenCalledTimes(1);
	});

	it("バリデーションエラー: タグ名が空の場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// getDatabase関数がmockDbとスキーマを返すように設定
		const { getDatabase } = await import("@/lib/database");
		(getDatabase as any).mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue(mockDb),
			tags: {},
			tagTranslations: {},
		});

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(400);
		expect(mockDb.insert).not.toHaveBeenCalled();
	});

	it("バリデーションエラー: スラッグが空の場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// getDatabase関数がmockDbとスキーマを返すように設定
		const { getDatabase } = await import("@/lib/database");
		(getDatabase as any).mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue(mockDb),
			tags: {},
			tagTranslations: {},
		});

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "",
			},
		});

		// Assert
		expect(res.status).toBe(400);
		expect(mockDb.insert).not.toHaveBeenCalled();
	});

	it("バリデーションエラー: スラッグが不正な形式の場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// getDatabase関数がmockDbとスキーマを返すように設定
		const { getDatabase } = await import("@/lib/database");
		(getDatabase as any).mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue(mockDb),
			tags: {},
			tagTranslations: {},
		});

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "Invalid Slug With Spaces!",
			},
		});

		// Assert
		expect(res.status).toBe(400);
		expect(mockDb.insert).not.toHaveBeenCalled();
	});

	it("重複エラー: 既存のスラッグの場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// getDatabase関数がmockDbとスキーマを返すように設定
		const { getDatabase } = await import("@/lib/database");
		(getDatabase as any).mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue(mockDb),
			tags: {},
			tagTranslations: {},
		});

		const existingTag = {
			id: 1,
			slug: "typescript",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		// 既存タグチェック用のモック
		const checkExistingMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([existingTag]), // 既存タグあり
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(checkExistingMock); // 既存タグチェック

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(409);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "SLUG_ALREADY_EXISTS",
				message: "このスラッグは既に使用されています",
			},
		});

		expect(mockDb.insert).not.toHaveBeenCalled();
		expect(mockDb.select).toHaveBeenCalledTimes(1);
	});

	it("DBエラー: データベースエラーの場合", async () => {
		// Arrange
		const { mockDb } = setupDbMocks();

		// getDatabase関数がmockDbとスキーマを返すように設定
		const { getDatabase } = await import("@/lib/database");
		(getDatabase as any).mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue(mockDb),
			tags: {},
			tagTranslations: {},
		});

		// DBエラーをシミュレート
		const checkExistingMock = {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockRejectedValue(new Error("Database error")),
				}),
			}),
		};

		mockDb.select.mockReturnValueOnce(checkExistingMock);

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(500);
		const data = await res.json();

		expect(data).toEqual({
			error: {
				code: "DATABASE_ERROR",
				message: "Failed to create tag",
			},
		});
	});

	/**
	 * 翻訳系テストの共通お膳立て
	 *
	 * @description
	 * タグ本体の作成と tag_translations への insert をモックする。
	 * insert は「1回目=タグ本体、2回目以降=翻訳行」の順で呼ばれるため、
	 * 翻訳行のモックは mockReturnValue で何回でも受けられるようにしている。
	 * どの言語が保存されたかは translationInsert.values の呼び出し履歴で検証する。
	 */
	const setupTranslationScenario = async () => {
		const { mockDb } = setupDbMocks();

		const { getDatabase } = await import("@/lib/database");
		(getDatabase as any).mockResolvedValue({
			createDatabaseClient: vi.fn().mockReturnValue(mockDb),
			tags: {},
			tagTranslations: {},
		});

		const mockNewTag = {
			id: 1,
			slug: "typescript",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		const insertTagMock = {
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockNewTag]),
			}),
		};

		const translationInsert = {
			values: vi.fn().mockResolvedValue(undefined),
		};

		// 既存タグチェック（重複なし）
		mockDb.select.mockReturnValueOnce({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		});

		mockDb.insert
			.mockReturnValueOnce(insertTagMock)
			.mockReturnValue(translationInsert);

		return { mockDb, translationInsert };
	};

	/** translationInsert に渡された言語コードの一覧を取り出す */
	const insertedLanguages = (translationInsert: {
		values: ReturnType<typeof vi.fn>;
	}): string[] =>
		translationInsert.values.mock.calls.map((call) => call[0].language);

	it("翻訳機能: GEMINI_API_KEYが設定されている場合、対応言語すべての翻訳を作成する", async () => {
		// Arrange
		const { mockDb, translationInsert } = await setupTranslationScenario();

		mockTranslateWithGemini.mockImplementation(
			async (_text: string, _key: string, target: string) =>
				target === "es" ? "Mecanografiado" : "TypeScript"
		);

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
			GEMINI_API_KEY: "test-gemini-key",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(201);

		// tag + ja + en + es
		expect(mockDb.insert).toHaveBeenCalledTimes(4);
		expect(insertedLanguages(translationInsert)).toEqual(["ja", "en", "es"]);

		// 各対応言語について、日本語名を元に翻訳が呼ばれている
		expect(mockTranslateWithGemini).toHaveBeenCalledWith(
			"タイプスクリプト",
			"test-gemini-key",
			"en"
		);
		expect(mockTranslateWithGemini).toHaveBeenCalledWith(
			"タイプスクリプト",
			"test-gemini-key",
			"es"
		);

		// スペイン語の訳文がそのまま保存されている
		expect(translationInsert.values).toHaveBeenCalledWith(
			expect.objectContaining({ language: "es", name: "Mecanografiado" })
		);
	});

	it("翻訳機能: GEMINI_API_KEYが設定されていない場合、日本語の翻訳のみ作成する", async () => {
		// Arrange
		const { mockDb, translationInsert } = await setupTranslationScenario();

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
			// GEMINI_API_KEY未設定
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(201);

		// tag + ja のみ
		expect(mockDb.insert).toHaveBeenCalledTimes(2);
		expect(insertedLanguages(translationInsert)).toEqual(["ja"]);
		expect(mockTranslateWithGemini).not.toHaveBeenCalled();
	});

	it("翻訳機能: スペイン語の翻訳が失敗しても英語の翻訳は保存される", async () => {
		// Arrange
		const { mockDb, translationInsert } = await setupTranslationScenario();

		// es だけ失敗させる（translateWithGeminiは失敗時にthrowする）
		mockTranslateWithGemini.mockImplementation(
			async (_text: string, _key: string, target: string) => {
				if (target === "es") {
					throw new Error("Failed to translate text with Gemini");
				}
				return "TypeScript";
			}
		);

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
			GEMINI_API_KEY: "test-gemini-key",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(201);

		// tag + ja + en（esは欠落するがタグ作成は成功する）
		expect(mockDb.insert).toHaveBeenCalledTimes(3);
		expect(insertedLanguages(translationInsert)).toEqual(["ja", "en"]);
	});

	it("翻訳機能: 英語の翻訳が失敗しても後続のスペイン語の翻訳は実行される", async () => {
		// Arrange
		const { mockDb, translationInsert } = await setupTranslationScenario();

		// 先頭言語(en)だけ失敗させ、ループが中断しないことを確認する
		mockTranslateWithGemini.mockImplementation(
			async (_text: string, _key: string, target: string) => {
				if (target === "en") {
					throw new Error("Failed to translate text with Gemini");
				}
				return "Mecanografiado";
			}
		);

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
			GEMINI_API_KEY: "test-gemini-key",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(201);

		// tag + ja + es
		expect(mockDb.insert).toHaveBeenCalledTimes(3);
		expect(insertedLanguages(translationInsert)).toEqual(["ja", "es"]);
	});

	it("翻訳機能: すべての言語の翻訳が失敗しても日本語の翻訳は作成され、処理は続行される", async () => {
		// Arrange
		const { mockDb, translationInsert } = await setupTranslationScenario();

		mockTranslateWithGemini.mockRejectedValue(
			new Error("Failed to translate text with Gemini")
		);

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
			GEMINI_API_KEY: "test-gemini-key",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(201);

		// 翻訳が全滅してもタグ本体と日本語訳は保存される
		expect(mockDb.insert).toHaveBeenCalledTimes(2);
		expect(insertedLanguages(translationInsert)).toEqual(["ja"]);
	});

	it("翻訳機能: 翻訳結果が空文字の場合は翻訳行を作成しない", async () => {
		// Arrange
		const { mockDb, translationInsert } = await setupTranslationScenario();

		// translateWithGeminiは空入力などで空文字を返すことがある
		mockTranslateWithGemini.mockResolvedValue("");

		// Act
		const client = testClient(tagsRoute, {
			TURSO_DATABASE_URL: "test://test.db",
			TURSO_AUTH_TOKEN: "test-token",
			GEMINI_API_KEY: "test-gemini-key",
		}) as any;
		const res = await client.index.$post({
			json: {
				name: "タイプスクリプト",
				slug: "typescript",
			},
		});

		// Assert
		expect(res.status).toBe(201);

		// 空の訳語で翻訳行を作らない（tag + ja のみ）
		expect(mockDb.insert).toHaveBeenCalledTimes(2);
		expect(insertedLanguages(translationInsert)).toEqual(["ja"]);
	});
});
