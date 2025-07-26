import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Extract search parameters from the request
		const searchParams = request.nextUrl.searchParams;
		const lang = searchParams.get("lang") || "ja";

		// Temporary mock data for testing
		const mockArticles = [
			{
				id: 1,
				slug: "hello-world",
				cfImageId: null,
				status: "published" as const,
				publishedAt: "2024-01-01T09:00:00Z",
				title: lang === "ja" ? "こんにちは世界" : "Hello World",
				content:
					lang === "ja"
						? "# こんにちは世界\n\nこれは最初のブログ記事です。\n\n## はじめに\n\nMarkdownで書かれた記事のサンプルです。"
						: "# Hello World\n\nThis is the first blog post.\n\n## Introduction\n\nThis is a sample article written in Markdown.",
			},
			{
				id: 2,
				slug: "typescript-tips",
				cfImageId: "typescript-tips-hero",
				status: "published" as const,
				publishedAt: "2024-02-15T10:30:00Z",
				title:
					lang === "ja"
						? "TypeScriptの便利なテクニック"
						: "Useful TypeScript Tips",
				content:
					lang === "ja"
						? "# TypeScriptの便利なテクニック\n\n## 型推論を活用する\n\nTypeScriptの強力な型推論を使いこなしましょう。"
						: "# Useful TypeScript Tips\n\n## Leveraging Type Inference\n\nMake the most of TypeScript's powerful type inference.",
			},
			{
				id: 3,
				slug: "life-in-2024",
				cfImageId: null,
				status: "published" as const,
				publishedAt: "2024-03-20T14:00:00Z",
				title: lang === "ja" ? "2024年の生活" : "Life in 2024",
				content:
					lang === "ja"
						? "# 2024年の生活\n\n今年の目標と振り返りについて書きます。"
						: "# Life in 2024\n\nWriting about goals and reflections for this year.",
			},
		];

		const mockResponse = {
			data: mockArticles,
			pagination: {
				page: 1,
				limit: 10,
				total: mockArticles.length,
				totalPages: 1,
			},
		};

		return Response.json(mockResponse);
	} catch (error) {
		console.error("API error:", error);
		return Response.json(
			{ error: "Failed to fetch articles" },
			{ status: 500 }
		);
	}
}
