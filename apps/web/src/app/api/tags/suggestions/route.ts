import { db } from "@saneatsu/db";
import { tags } from "@saneatsu/db/src/schema";
import { like } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

/**
 * タグサジェストAPI
 *
 * @description
 * 1. クエリパラメータから検索文字列を取得
 * 2. データベースからマッチするタグを検索
 * 3. 使用回数順にソートして返す
 */
export async function GET(req: NextRequest) {
	try {
		const searchParams = req.nextUrl.searchParams;
		const query = searchParams.get("q") || "";

		// 空のクエリの場合は、全てのタグを返す
		if (!query.trim()) {
			const allTags = await db
				.select({
					id: tags.id,
					slug: tags.slug,
				})
				.from(tags)
				.limit(10);

			return NextResponse.json({
				suggestions: allTags.map((tag: (typeof allTags)[0]) => ({
					id: tag.id ?? 0,
					slug: tag.slug,
					name: tag.slug,
					type: "tag" as const,
				})),
			});
		}

		// クエリにマッチするタグを検索
		const matchingTags = await db
			.select({
				id: tags.id,
				slug: tags.slug,
			})
			.from(tags)
			.where(like(tags.slug, `%${query}%`))
			.limit(10);

		return NextResponse.json({
			suggestions: matchingTags.map((tag: (typeof matchingTags)[0]) => ({
				id: tag.id ?? 0,
				slug: tag.slug,
				name: tag.slug,
				type: "tag" as const,
			})),
		});
	} catch (error) {
		console.error("タグサジェストAPI エラー:", error);
		return NextResponse.json(
			{ error: "タグの取得に失敗しました" },
			{ status: 500 }
		);
	}
}
