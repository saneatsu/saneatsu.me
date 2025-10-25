/**
 * UUIDv4形式の文字列を表すブランド型
 *
 * @description
 * ランタイムでバリデーションされたUUIDのみがこの型を持つことを保証する。
 * 形式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export type UUID = string & { readonly __brand: "UUID" };

/**
 * Image IDのプレフィックス
 *
 * @description
 * カスタムImage IDのプレフィックスを定義する。
 * これにより画像の用途を明確に区別できる。
 *
 * - thumbnail: 記事のサムネイル画像
 * - content: 記事本文内の画像
 */
export type ImageIdPrefix = "thumbnail" | "content";

/**
 * カスタムImage ID型
 *
 * @description
 * `saneatsu-me_<prefix>_<uuid>` の厳密な形式
 *
 * @example
 * - "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f"
 * - "saneatsu-me_content_3edd39g1-128b-50d5-0fe8-98167d94012g"
 */
export type CustomImageId = `saneatsu-me_${ImageIdPrefix}_${UUID}`;

/**
 * 文字列がUUID形式かチェックする型ガード
 *
 * @param value - チェックする文字列
 * @returns UUIDv4形式の場合true
 *
 * @example
 * const str = "2cdc28f0-017a-49c4-9ed7-87056c83901f";
 * if (isUUID(str)) {
 *   // この時点でstrの型はUUID
 *   const uuid: UUID = str;
 * }
 */
export function isUUID(value: string): value is UUID {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(value);
}

/**
 * UUID文字列をバリデーション
 *
 * @param value - バリデーションする文字列
 * @returns バリデーション済みUUID（型ガードで保証）
 * @throws {Error} 不正なUUID形式の場合
 *
 * @example
 * const uuid = validateUUID("2cdc28f0-017a-49c4-9ed7-87056c83901f");
 * // uuid の型は UUID
 */
export function validateUUID(value: string): UUID {
	if (!isUUID(value)) {
		throw new Error(`Invalid UUID format: ${value}`);
	}
	return value;
}

/**
 * 新しいUUIDv4を生成
 *
 * @returns 生成されたUUID（crypto.randomUUID()は常に有効なUUIDを返すため安全）
 *
 * @example
 * const uuid = generateUUID();
 * // uuid の型は UUID
 */
export function generateUUID(): UUID {
	const uuid = crypto.randomUUID();
	// crypto.randomUUID()は仕様上必ずUUIDv4を返すため、理論上はバリデーション不要
	// しかし型システムではstring型なので、型ガードで保証
	if (!isUUID(uuid)) {
		// これは理論上到達不可能だが、型安全性のため
		throw new Error("crypto.randomUUID() returned invalid UUID");
	}
	return uuid;
}

/**
 * 文字列がCustomImageId形式かチェックする型ガード
 *
 * @param value - チェックする文字列
 * @returns CustomImageId形式の場合true
 *
 * @example
 * const str = "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f";
 * if (isCustomImageId(str)) {
 *   // この時点でstrの型はCustomImageId
 *   const id: CustomImageId = str;
 * }
 */
export function isCustomImageId(value: string): value is CustomImageId {
	const regex =
		/^saneatsu-me_(thumbnail|content)_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return regex.test(value);
}

/**
 * カスタムImage IDを生成
 *
 * @param prefix - Image IDのプレフィックス（'thumbnail' または 'content'）
 * @returns バリデーション済みカスタムImage ID
 * @throws {Error} 生成されたIDが不正な形式の場合（理論上到達不可能）
 *
 * @example
 * const thumbnailId = createCustomImageId('thumbnail');
 * // thumbnailId: "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f"
 *
 * const contentId = createCustomImageId('content');
 * // contentId: "saneatsu-me_content_3edd39g1-128b-50d5-0fe8-98167d94012g"
 */
export function createCustomImageId(prefix: ImageIdPrefix): CustomImageId {
	const uuid = generateUUID();
	const customId = `saneatsu-me_${prefix}_${uuid}`;

	// 型ガードで検証
	if (!isCustomImageId(customId)) {
		// これは理論上到達不可能だが、型安全性のため
		throw new Error(`Failed to create valid CustomImageId: ${customId}`);
	}

	return customId;
}

/**
 * カスタムImage IDからUUIDを抽出
 *
 * @param customId - カスタムImage ID
 * @returns 抽出されたUUID
 * @throws {Error} 不正なCustomImageId形式の場合
 *
 * @example
 * const customId: CustomImageId = "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f";
 * const uuid = extractUUIDFromCustomId(customId);
 * // uuid: "2cdc28f0-017a-49c4-9ed7-87056c83901f" (型: UUID)
 */
export function extractUUIDFromCustomId(customId: CustomImageId): UUID {
	const parts = customId.split("_");
	const uuidPart = parts[2];

	if (!uuidPart) {
		throw new Error(`Invalid CustomImageId format: ${customId}`);
	}

	return validateUUID(uuidPart);
}

/**
 * カスタムImage IDからプレフィックスを抽出
 *
 * @param customId - カスタムImage ID
 * @returns 抽出されたプレフィックス
 * @throws {Error} 不正なCustomImageId形式の場合
 *
 * @example
 * const customId: CustomImageId = "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f";
 * const prefix = extractPrefixFromCustomId(customId);
 * // prefix: "thumbnail"
 */
export function extractPrefixFromCustomId(
	customId: CustomImageId
): ImageIdPrefix {
	const parts = customId.split("_");
	const prefix = parts[1];

	if (prefix !== "thumbnail" && prefix !== "content") {
		throw new Error(`Invalid CustomImageId prefix: ${prefix}`);
	}

	return prefix;
}
