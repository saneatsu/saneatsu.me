import type { RouteHandler } from "@hono/zod-openapi";
import { and, asc, desc, eq, isNotNull, or, type SQL, sql } from "drizzle-orm";

import type { Env } from "@/env";
import { getDatabase } from "@/lib";

import type { getAdminGalleryImagesRoute } from "./get-admin-gallery-images.openapi";

type Handler = RouteHandler<
	typeof getAdminGalleryImagesRoute,
	{ Bindings: Env }
>;

/**
 * GET /api/admin/gallery/images - Admin用ギャラリー画像一覧取得
 *
 * @description
 * 処理フロー:
 * 1. DBクライアントを作成
 * 2. クエリパラメータを取得（page、limit、sortBy、sortOrder、hasLocation、status）
 * 3. ページネーションの計算
 * 4. クエリ条件を構築
 *    4.1. ステータスでフィルタリング
 *        - statusパラメータがある場合: 指定されたステータス（カンマ区切り対応）でフィルタ
 *        - statusパラメータがない場合: 全てのステータスを返す
 *    4.2. 位置情報の有無でフィルタリング
 * 5. ソート条件を設定（createdAt、takenAt、updatedAt）
 * 6. ギャラリー画像一覧を取得
 * 7. 各画像の翻訳データを取得
 * 8. 総画像数を取得
 * 9. レスポンスを返す
 *
 * @remarks
 * レスポンスには各画像のtranslations配列が含まれる。
 * translationsには {language: 'ja'|'en', title, description} の形式で
 * 多言語対応データが格納される。
 */
export const getAdminGalleryImagesHandler: Handler = async (c) => {
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
		const status = query.status;

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

		// 4.1. ステータスでフィルタリング
		if (status) {
			// statusパラメータがある場合: カンマ区切りでパースして条件を追加
			const statuses = status.split(",").map((s) => s.trim()) as (
				| "published"
				| "draft"
			)[];

			if (statuses.length === 1) {
				// ステータスが1つの場合
				conditions.push(eq(galleryImages.status, statuses[0]));
			} else {
				// ステータスが複数の場合（例: "published,draft"）
				const statusConditions = or(
					...statuses.map((s) => eq(galleryImages.status, s))
				);
				if (statusConditions) {
					conditions.push(statusConditions);
				}
			}
		}
		// statusパラメータがない場合は条件を追加しない（全てのステータスを返す）

		// 4.2. 位置情報の有無でフィルタリング
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

		// 6. ギャラリー画像一覧を取得
		const whereClause =
			conditions.length === 0
				? undefined
				: conditions.length === 1
					? conditions[0]
					: and(...conditions);

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
			.where(whereClause)
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

		// 8. 総画像数を取得
		const [{ count }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(galleryImages)
			.where(whereClause);

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
		console.error("Error getting admin gallery images:", error);
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
