import type { NextRequest } from "next/server";

// バックエンドAPIのURL
const BACKEND_API_URL =
	process.env.BACKEND_API_URL || "http://localhost:8888/api";

export async function GET(request: NextRequest) {
	try {
		// リクエストのクエリパラメータをそのまま転送
		const searchParams = request.nextUrl.searchParams;
		const queryString = searchParams.toString();

		// バックエンドAPIにプロキシ
		const response = await fetch(
			`${BACKEND_API_URL}/articles/check-slug${queryString ? `?${queryString}` : ""}`
		);

		if (!response.ok) {
			throw new Error(`Backend API error: ${response.status}`);
		}

		const data = await response.json();
		return Response.json(data);
	} catch (error) {
		console.error("API proxy error:", error);
		return Response.json(
			{
				error: {
					code: "PROXY_ERROR",
					message: "Failed to check slug from backend",
				},
			},
			{ status: 500 }
		);
	}
}
