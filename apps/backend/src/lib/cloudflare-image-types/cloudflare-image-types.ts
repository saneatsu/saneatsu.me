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
 * 環境名
 *
 * @description
 * デプロイ環境を表す。
 * 開発環境とプレビュー環境では環境プレフィックスが付く。
 *
 * - development: ローカル開発環境
 * - preview: プレビュー環境
 * - production: 本番環境（プレフィックスなし）
 */
export type Environment = "development" | "preview" | "production";

/**
 * カスタムImage ID型
 *
 * @description
 * 環境に応じた形式のカスタムImage ID。
 *
 * 本番環境:
 * - `saneatsu-me_<prefix>_<uuid>`
 *
 * 開発・プレビュー環境:
 * - `saneatsu-me_development_<prefix>_<uuid>`
 * - `saneatsu-me_preview_<prefix>_<uuid>`
 *
 * @example
 * // 本番環境
 * - "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f"
 * - "saneatsu-me_content_3edd39g1-128b-50d5-0fe8-98167d94012g"
 *
 * // 開発環境
 * - "saneatsu-me_development_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f"
 * - "saneatsu-me_development_content_3edd39g1-128b-50d5-0fe8-98167d94012g"
 *
 * // プレビュー環境
 * - "saneatsu-me_preview_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f"
 * - "saneatsu-me_preview_content_3edd39g1-128b-50d5-0fe8-98167d94012g"
 */
export type CustomImageId =
	| `saneatsu-me_${ImageIdPrefix}_${UUID}` // production
	| `saneatsu-me_development_${ImageIdPrefix}_${UUID}` // development
	| `saneatsu-me_preview_${ImageIdPrefix}_${UUID}`; // preview

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
 * // 本番環境
 * const str1 = "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f";
 * if (isCustomImageId(str1)) {
 *   // この時点でstr1の型はCustomImageId
 *   const id: CustomImageId = str1;
 * }
 *
 * // 開発環境
 * const str2 = "saneatsu-me_development_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f";
 * if (isCustomImageId(str2)) {
 *   // この時点でstr2の型はCustomImageId
 *   const id: CustomImageId = str2;
 * }
 */
export function isCustomImageId(value: string): value is CustomImageId {
	// 本番環境: saneatsu-me_(thumbnail|content)_<uuid>
	// 開発/プレビュー環境: saneatsu-me_(development|preview)_(thumbnail|content)_<uuid>
	const regex =
		/^saneatsu-me_(?:(development|preview)_)?(thumbnail|content)_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return regex.test(value);
}

/**
 * カスタムImage IDを生成
 *
 * @param prefix - Image IDのプレフィックス（'thumbnail' または 'content'）
 * @param environment - 環境名（省略時は 'production'）
 * @returns バリデーション済みカスタムImage ID
 * @throws {Error} 生成されたIDが不正な形式の場合（理論上到達不可能）
 *
 * @example
 * // 本番環境
 * const thumbnailId = createCustomImageId('thumbnail', 'production');
 * // thumbnailId: "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f"
 *
 * // 開発環境
 * const devThumbnailId = createCustomImageId('thumbnail', 'development');
 * // devThumbnailId: "saneatsu-me_development_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f"
 *
 * // プレビュー環境
 * const previewContentId = createCustomImageId('content', 'preview');
 * // previewContentId: "saneatsu-me_preview_content_3edd39g1-128b-50d5-0fe8-98167d94012g"
 */
export function createCustomImageId(
	prefix: ImageIdPrefix,
	environment: Environment = "production"
): CustomImageId {
	const uuid = generateUUID();

	// 本番環境の場合は環境プレフィックスなし
	const customId =
		environment === "production"
			? `saneatsu-me_${prefix}_${uuid}`
			: `saneatsu-me_${environment}_${prefix}_${uuid}`;

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
 * // 本番環境
 * const customId1: CustomImageId = "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f";
 * const uuid1 = extractUUIDFromCustomId(customId1);
 * // uuid1: "2cdc28f0-017a-49c4-9ed7-87056c83901f" (型: UUID)
 *
 * // 開発環境
 * const customId2: CustomImageId = "saneatsu-me_development_content_2cdc28f0-017a-49c4-9ed7-87056c83901f";
 * const uuid2 = extractUUIDFromCustomId(customId2);
 * // uuid2: "2cdc28f0-017a-49c4-9ed7-87056c83901f" (型: UUID)
 */
export function extractUUIDFromCustomId(customId: CustomImageId): UUID {
	const parts = customId.split("_");

	// 環境プレフィックスがある場合（development/preview）: parts[3]
	// 環境プレフィックスがない場合（production）: parts[2]
	const uuidPart =
		parts[1] === "development" || parts[1] === "preview" ? parts[3] : parts[2];

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
 * // 本番環境
 * const customId1: CustomImageId = "saneatsu-me_thumbnail_2cdc28f0-017a-49c4-9ed7-87056c83901f";
 * const prefix1 = extractPrefixFromCustomId(customId1);
 * // prefix1: "thumbnail"
 *
 * // 開発環境
 * const customId2: CustomImageId = "saneatsu-me_development_content_2cdc28f0-017a-49c4-9ed7-87056c83901f";
 * const prefix2 = extractPrefixFromCustomId(customId2);
 * // prefix2: "content"
 */
export function extractPrefixFromCustomId(
	customId: CustomImageId
): ImageIdPrefix {
	const parts = customId.split("_");

	// 環境プレフィックスがある場合（development/preview）: parts[2]
	// 環境プレフィックスがない場合（production）: parts[1]
	const prefix =
		parts[1] === "development" || parts[1] === "preview" ? parts[2] : parts[1];

	if (!prefix || (prefix !== "thumbnail" && prefix !== "content")) {
		throw new Error(`Invalid CustomImageId prefix: ${prefix}`);
	}

	return prefix;
}
