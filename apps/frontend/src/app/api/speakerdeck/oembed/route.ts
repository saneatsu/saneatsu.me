import { type NextRequest, NextResponse } from "next/server";

const SPEAKER_DECK_OEMBED_ENDPOINT =
	"https://speakerdeck.com/oembed.json" as const;

/**
 * Speaker Deck oEmbed プロキシ
 *
 * ブラウザから直接Speaker Deckを叩くとCORSで弾かれるため、
 * Next.jsのサーバー経由でoEmbedレスポンスを取得して返す。
 */
export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const url = searchParams.get("url");
	const slide = searchParams.get("slide");

	if (!url) {
		return NextResponse.json(
			{ error: "Missing url parameter" },
			{ status: 400 }
		);
	}

	const oEmbedUrl = new URL(SPEAKER_DECK_OEMBED_ENDPOINT);
	oEmbedUrl.searchParams.set("url", url);
	if (slide) {
		oEmbedUrl.searchParams.set("slide", slide);
	}

	try {
		const response = await fetch(oEmbedUrl, {
			headers: { Accept: "application/json" },
			// Speaker Deck側でキャッシュしているので追加でrevalidate
			next: { revalidate: 3600 },
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch Speaker Deck data" },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return NextResponse.json(data, {
			headers: {
				"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
			},
		});
	} catch (error) {
		console.error("Speaker Deck oEmbed proxy error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
