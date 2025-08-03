import { db } from "@saneatsu/db";
import { tags } from "@saneatsu/db/src/schema";
import { desc, like } from "drizzle-orm";
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

		// 空のクエリの場合は、人気のタグを返す
		if (!query.trim()) {
			const popularTags = await db
				.select({
					id: tags.id,
					name: tags.name,
					usageCount: tags.usageCount,
				})
				.from(tags)
				.orderBy(desc(tags.usageCount))
				.limit(10);

			return NextResponse.json({
				suggestions: popularTags.map((tag: (typeof popularTags)[0]) => ({
					id: tag.id!,
					name: tag.name,
					usageCount: tag.usageCount,
					type: "tag" as const,
				})),
			});
		}

		// クエリにマッチするタグを検索
		const matchingTags = await db
			.select({
				id: tags.id,
				name: tags.name,
				usageCount: tags.usageCount,
			})
			.from(tags)
			.where(like(tags.name, `%${query}%`))
			.orderBy(desc(tags.usageCount))
			.limit(10);

		return NextResponse.json({
			suggestions: matchingTags.map((tag: (typeof matchingTags)[0]) => ({
				id: tag.id!,
				name: tag.name,
				usageCount: tag.usageCount,
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
