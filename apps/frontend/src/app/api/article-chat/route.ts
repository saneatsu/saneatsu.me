import { GoogleGenerativeAI } from "@google/generative-ai";
import { type NextRequest, NextResponse } from "next/server";

import type { ArticleChatErrorCode } from "@/features/article-chat/model/article-chat-error-code";

/** リクエストボディの最大文字数 */
const MAX_ARTICLE_CONTENT_LENGTH = 100_000;
/** メッセージの最大文字数（フロントエンドのi18n翻訳パラメータとしても使用するためexport） */
export const MAX_MESSAGE_LENGTH = 2_000;

/** エラーコードに型制約をかけたJSONレスポンスを生成する */
function errorResponse(error: ArticleChatErrorCode, status: number) {
	return NextResponse.json({ error }, { status });
}

/**
 * 記事AIチャット API Route
 *
 * @description
 * 記事のMarkdownコンテンツをコンテキストとして、Gemini APIにストリーミングリクエストを送信する。
 *
 * 1. リクエストボディから message と articleContent を取得・バリデーション
 * 2. Gemini API でシステムプロンプト付きストリーミング生成（エラー時はHTTPレスポンスとして返す）
 * 3. ReadableStream でクライアントにチャンクを転送
 *
 * エラーケース:
 * - GEMINI_API_KEY 未設定: 500
 * - message/articleContent 未指定または文字数超過: 400
 * - Gemini API レート制限: 429
 * - Gemini API その他のエラー: 500
 */
export async function POST(request: NextRequest) {
	// 1. リクエストボディのパース
	let body: { message?: string; articleContent?: string };
	try {
		body = await request.json();
	} catch {
		return errorResponse("INVALID_REQUEST", 400);
	}

	const { message, articleContent } = body;

	// 2. バリデーション
	if (!message || !articleContent) {
		return errorResponse("REQUIRED_FIELDS", 400);
	}

	if (message.length > MAX_MESSAGE_LENGTH) {
		return errorResponse("MESSAGE_TOO_LONG", 400);
	}

	if (articleContent.length > MAX_ARTICLE_CONTENT_LENGTH) {
		return errorResponse("CONTENT_TOO_LARGE", 400);
	}

	// 3. Gemini APIでストリーミング生成
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		return errorResponse("AI_UNAVAILABLE", 500);
	}

	const genAI = new GoogleGenerativeAI(apiKey);
	const systemPrompt = `You are an assistant that answers questions about the article below.
If the question is unrelated to the article, reply: "I can only answer questions about this article."
Respond in the same language as the user's question.

--- Article Content ---
${articleContent}
--- End of Article Content ---`;

	const model = genAI.getGenerativeModel({
		model: "gemini-2.5-flash",
		systemInstruction: systemPrompt,
	});

	// 4. Gemini APIにリクエストを送信し、エラーはHTTPレスポンスとして返す
	let result: Awaited<ReturnType<typeof model.generateContentStream>>;
	try {
		result = await model.generateContentStream(message);
	} catch (error) {
		console.error("Gemini API error:", error);
		const isRateLimit = error instanceof Error && error.message.includes("429");
		return isRateLimit
			? errorResponse("RATE_LIMIT_EXCEEDED", 429)
			: errorResponse("GENERATION_FAILED", 500);
	}

	// 5. ReadableStreamでクライアントにチャンクを転送
	const stream = new ReadableStream({
		async start(controller) {
			try {
				for await (const chunk of result.stream) {
					const text = chunk.text();
					if (text) {
						controller.enqueue(new TextEncoder().encode(text));
					}
				}
				controller.close();
			} catch (error) {
				console.error("Gemini stream error:", error);
				controller.error(new Error("Stream generation failed"));
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Transfer-Encoding": "chunked",
		},
	});
}
