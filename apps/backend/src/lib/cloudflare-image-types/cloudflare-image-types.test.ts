import { describe, expect, it } from "vitest";

import {
	type CustomImageId,
	createCustomImageId,
	extractPrefixFromCustomId,
	extractUUIDFromCustomId,
	generateUUID,
	type ImageIdPrefix,
	isCustomImageId,
	isUUID,
	type UUID,
	validateUUID,
} from "./cloudflare-image-types";

describe("ユニットテスト", () => {
	describe("isUUID", () => {
		it("有効なUUIDv4の場合、trueを返す", () => {
			expect(isUUID("2cdc28f0-017a-49c4-9ed7-87056c83901f")).toBe(true);
			expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
		});

		it("無効なUUIDの場合、falseを返す", () => {
			expect(isUUID("invalid-uuid")).toBe(false);
			expect(isUUID("123456")).toBe(false);
			expect(isUUID("")).toBe(false);
		});

		it("UUIDv1形式の場合、falseを返す", () => {
			// UUIDv4は3番目のブロックが4で始まる
			expect(isUUID("550e8400-e29b-11d4-a716-446655440000")).toBe(false);
		});
	});

	describe("validateUUID", () => {
		it("有効なUUIDv4の場合、UUID型を返す", () => {
			const uuid = validateUUID("2cdc28f0-017a-49c4-9ed7-87056c83901f");
			expect(uuid).toBe("2cdc28f0-017a-49c4-9ed7-87056c83901f");
			// 型チェック: UUIDを別の変数に代入できる
			const _typedUuid: UUID = uuid;
		});

		it("無効なUUIDの場合、エラーをスローする", () => {
			expect(() => validateUUID("invalid-uuid")).toThrow(
				"Invalid UUID format: invalid-uuid"
			);
		});
	});

	describe("generateUUID", () => {
		it("有効なUUIDv4を生成する", () => {
			const uuid = generateUUID();
			expect(isUUID(uuid)).toBe(true);
		});

		it("ユニークなUUIDを生成する", () => {
			const uuid1 = generateUUID();
			const uuid2 = generateUUID();
			expect(uuid1).not.toBe(uuid2);
		});

		it("UUID型を返す", () => {
			const uuid = generateUUID();
			// 型チェック: UUIDを別の変数に代入できる
			const _typedUuid: UUID = uuid;
		});
	});

	describe("isCustomImageId", () => {
		it("有効なthumbnail CustomImageIdの場合、trueを返す", () => {
			expect(
				isCustomImageId(
					"saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f"
				)
			).toBe(true);
		});

		it("有効なcontent CustomImageIdの場合、trueを返す", () => {
			expect(
				isCustomImageId(
					"saneatsu-me_content_550e8400-e29b-41d4-a716-446655440000"
				)
			).toBe(true);
		});

		it("無効なプレフィックスの場合、falseを返す", () => {
			expect(
				isCustomImageId(
					"saneatsu-me_invalid_2cdc28f0-017a-49c4-9ed7-87056c83901f"
				)
			).toBe(false);
		});

		it("無効なUUID部分の場合、falseを返す", () => {
			expect(isCustomImageId("saneatsu-me_thumbnail_invalid-uuid")).toBe(false);
		});

		it("無効なフォーマットの場合、falseを返す", () => {
			expect(isCustomImageId("invalid-format")).toBe(false);
			expect(isCustomImageId("")).toBe(false);
		});
	});

	describe("createCustomImageId", () => {
		it("有効なthumbnail CustomImageIdを生成する", () => {
			const customId = createCustomImageId("thumbnail");
			expect(isCustomImageId(customId)).toBe(true);
			expect(customId.startsWith("saneatsu-me_thumbnail_")).toBe(true);
		});

		it("有効なcontent CustomImageIdを生成する", () => {
			const customId = createCustomImageId("content");
			expect(isCustomImageId(customId)).toBe(true);
			expect(customId.startsWith("saneatsu-me_content_")).toBe(true);
		});

		it("ユニークなCustomImageIdを生成する", () => {
			const customId1 = createCustomImageId("thumbnail");
			const customId2 = createCustomImageId("thumbnail");
			expect(customId1).not.toBe(customId2);
		});

		it("CustomImageId型を返す", () => {
			const customId = createCustomImageId("thumbnail");
			// 型チェック: CustomImageIdを別の変数に代入できる
			const _typedCustomId: CustomImageId = customId;
		});
	});

	describe("extractUUIDFromCustomId", () => {
		it("thumbnail CustomImageIdからUUIDを抽出する", () => {
			const customId =
				"saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f" as CustomImageId;
			const uuid = extractUUIDFromCustomId(customId);
			expect(uuid).toBe("2cdc28f0-017a-49c4-9ed7-87056c83901f");
			expect(isUUID(uuid)).toBe(true);
		});

		it("content CustomImageIdからUUIDを抽出する", () => {
			const customId =
				"saneatsu-me_content_550e8400-e29b-41d4-a716-446655440000" as CustomImageId;
			const uuid = extractUUIDFromCustomId(customId);
			expect(uuid).toBe("550e8400-e29b-41d4-a716-446655440000");
		});

		it("無効なCustomImageIdフォーマットの場合、エラーをスローする", () => {
			const invalidId = "invalid_format" as CustomImageId;
			expect(() => extractUUIDFromCustomId(invalidId)).toThrow(
				"Invalid CustomImageId format"
			);
		});

		it("無効なUUID部分の場合、エラーをスローする", () => {
			const invalidId = "saneatsu-me_thumbnail_invalid-uuid" as CustomImageId;
			expect(() => extractUUIDFromCustomId(invalidId)).toThrow(
				"Invalid UUID format"
			);
		});
	});

	describe("extractPrefixFromCustomId", () => {
		it("thumbnail CustomImageIdから'thumbnail'プレフィックスを抽出する", () => {
			const customId =
				"saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f" as CustomImageId;
			const prefix = extractPrefixFromCustomId(customId);
			expect(prefix).toBe("thumbnail");
			// 型チェック: ImageIdPrefixを別の変数に代入できる
			const _typedPrefix: ImageIdPrefix = prefix;
		});

		it("content CustomImageIdから'content'プレフィックスを抽出する", () => {
			const customId =
				"saneatsu-me_content_550e8400-e29b-41d4-a716-446655440000" as CustomImageId;
			const prefix = extractPrefixFromCustomId(customId);
			expect(prefix).toBe("content");
		});

		it("無効なプレフィックスの場合、エラーをスローする", () => {
			const invalidId =
				"saneatsu-me_invalid_2cdc28f0-017a-49c4-9ed7-87056c83901f" as CustomImageId;
			expect(() => extractPrefixFromCustomId(invalidId)).toThrow(
				"Invalid CustomImageId prefix: invalid"
			);
		});
	});
});
