import type { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3333";

export async function GET(request: NextRequest) {
	try {
		// Extract search parameters from the request
		const searchParams = request.nextUrl.searchParams;
		const queryString = searchParams.toString();

		// Forward the request to the backend server
		const backendUrl = `${BACKEND_URL}/api/articles${queryString ? `?${queryString}` : ""}`;

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
			{ error: "Failed to fetch articles" },
			{ status: 500 }
		);
	}
}
