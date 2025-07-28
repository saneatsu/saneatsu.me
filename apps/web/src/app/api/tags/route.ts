import type { NextRequest } from "next/server";

// バックエンドAPIのURL
const BACKEND_API_URL =
	process.env.BACKEND_API_URL || "http://localhost:8888/api";

export async function GET(request: NextRequest) {
	try {
		// Extract search parameters from the request
		const searchParams = request.nextUrl.searchParams;
		const queryString = searchParams.toString();

		// バックエンドAPIにプロキシ
		const backendUrl = `${BACKEND_API_URL}/tags${queryString ? `?${queryString}` : ""}`;

		const response = await fetch(backendUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

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
					message: "Failed to fetch tags from backend",
				},
			},
			{ status: 500 }
		);
	}
}
