import type { RouteHandler } from "@hono/zod-openapi";
import { and, asc, desc, eq, isNotNull, sql, type SQL } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";

import type { getGalleryImagesRoute } from "./get-gallery-images.openapi";

type Handler = RouteHandler<typeof getGalleryImagesRoute, { Bindings: Env }>;

/**
 * GET /api/gallery/images - ギャラリー画像一覧取得
 *
 * @description
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. クエリパラメータを取得
 * 3. ページネーションの計算
 * 4. クエリ条件を構築（位置情報の有無でフィルタリング）
 * 5. ソート条件を設定（createdAt、takenAt、updatedAt）
 * 6. ギャラリー画像一覧を取得
 *    - statusが"published"の画像のみを表示
 * 7. 各画像の翻訳データを取得
 * 8. 総画像数を取得（公開済みのみ）
 * 9. レスポンスを返す
 *
 * @remarks
 * レスポンスには各画像のtranslations配列が含まれる。
 * translationsには {language: 'ja'|'en', title, description} の形式で
 * 多言語対応データが格納される。
 */
export const getGalleryImagesHandler: Handler = async (c) => {
	try {
		// 1. DBクライアントを作成
		const { createDatabaseClient, galleryImages, galleryImageTranslations } =
			await getDatabase();
		const db = createDatabaseClient(c.env);

		// 2. クエリパラメータを取得
		const query = c.req.valid("query");
		const page = Number.parseInt(query.page || "1", 10);
		const limit = Number.parseInt(query.limit || "20", 10);
		const sortBy = query.sortBy || "createdAt";
		const sortOrder = query.sortOrder || "desc";
		const hasLocation = query.hasLocation;

		// バリデーション
		if (page < 1) {
			return c.json(
				{
					error: {
						code: "INVALID_PAGE",
						message: "ページ番号は1以上を指定してください。",
					},
				},
				400
			);
		}

		if (limit < 1 || limit > 100) {
			return c.json(
				{
					error: {
						code: "INVALID_LIMIT",
						message: "1ページあたりの画像数は1から100の間で指定してください。",
					},
				},
				400
			);
		}

		// 3. ページネーションの計算
		const offset = (page - 1) * limit;

		// 4. クエリ条件を構築
		const conditions: SQL[] = [];

		// 公開済みの画像のみを取得
		conditions.push(eq(galleryImages.status, "published"));

		// 位置情報の有無でフィルタリング
		if (hasLocation === "true") {
			// latitude と longitude の両方が null でないことを確認
			conditions.push(isNotNull(galleryImages.latitude));
			conditions.push(isNotNull(galleryImages.longitude));
		} else if (hasLocation === "false") {
			// latitude または longitude のいずれかが null であることを確認
			conditions.push(
				sql`(${galleryImages.latitude} IS NULL OR ${galleryImages.longitude} IS NULL)`
			);
		}

		// 5. ソート条件を設定
		const orderByClause =
			sortBy === "takenAt"
				? sortOrder === "asc"
					? asc(galleryImages.takenAt)
					: desc(galleryImages.takenAt)
				: sortBy === "updatedAt"
					? sortOrder === "asc"
						? asc(galleryImages.updatedAt)
						: desc(galleryImages.updatedAt)
					: sortOrder === "asc"
						? asc(galleryImages.createdAt)
						: desc(galleryImages.createdAt);

		// 6. ギャラリー画像一覧を取得（公開済みのみ）
		const images = await db
			.select({
				id: galleryImages.id,
				cfImageId: galleryImages.cfImageId,
				latitude: galleryImages.latitude,
				longitude: galleryImages.longitude,
				takenAt: galleryImages.takenAt,
				status: galleryImages.status,
				createdAt: galleryImages.createdAt,
				updatedAt: galleryImages.updatedAt,
			})
			.from(galleryImages)
			.where(conditions.length === 1 ? conditions[0] : and(...conditions))
			.orderBy(orderByClause)
			.limit(limit)
			.offset(offset);

		// 7. 各画像の翻訳データを取得
		const imagesWithTranslations = await Promise.all(
			images.map(async (image) => {
				const translations = await db
					.select()
					.from(galleryImageTranslations)
					.where(sql`${galleryImageTranslations.galleryImageId} = ${image.id}`);

				return {
					...image,
					translations,
				};
			})
		);

		// 8. 総画像数を取得（公開済みのみ）
		const [{ count }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(galleryImages)
			.where(conditions.length === 1 ? conditions[0] : and(...conditions));

		// 9. レスポンスを返す
		return c.json(
			{
				images: imagesWithTranslations,
				total: count,
				page,
				limit,
			},
			200
		);
	} catch (error) {
		console.error("Error getting gallery images:", error);
		return c.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: "ギャラリー画像の取得に失敗しました",
				},
			},
			500
		);
	}
};
