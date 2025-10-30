import { NextRequest, NextResponse } from "next/server";

/**
 * ツイートIDからトークンを生成
 *
 * @description
 * Twitter Syndication APIで使用するトークンを生成する。
 * react-tweetと同じアルゴリズムを使用。
 *
 * @param id - ツイートID
 * @returns トークン文字列
 */
function getToken(id: string): string {
	return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");
}

/**
 * Twitter Syndication APIのメタデータ取得API Route
 *
 * @description
 * CORS問題を回避するために、サーバー側でTwitter Syndication APIを叩く。
 * ツイートの画像有無などのメタデータを返す。
 *
 * @param request - Next.js Request
 * @returns メタデータJSON
 *
 * @example
 * GET /api/tweet-metadata?id=1234567890123456789
 */
export async function GET(request: NextRequest) {
	try {
		// クエリパラメータからツイートIDを取得
		const searchParams = request.nextUrl.searchParams;
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ error: "Missing tweet id parameter" },
				{ status: 400 },
			);
		}

		// Twitter Syndication APIを叩く
		const token = getToken(id);
		const url = `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${token}`;

		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; TweetEmbed/1.0)",
			},
		});

		if (!response.ok) {
			console.warn(
				`Twitter Syndication API returned ${response.status} for tweet ${id}`,
			);
			return NextResponse.json(
				{ error: "Failed to fetch tweet metadata" },
				{ status: response.status },
			);
		}

		const data = await response.json();

		// キャッシュヘッダーを設定（1時間）
		return NextResponse.json(data, {
			headers: {
				"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
			},
		});
	} catch (error) {
		console.error("Error in tweet-metadata API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
