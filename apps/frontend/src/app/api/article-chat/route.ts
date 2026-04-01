import { GoogleGenerativeAI } from "@google/generative-ai";
import { type NextRequest, NextResponse } from "next/server";

/** リクエストボディの最大文字数 */
const MAX_ARTICLE_CONTENT_LENGTH = 100_000;
const MAX_MESSAGE_LENGTH = 2_000;

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
		return NextResponse.json(
			{ error: "リクエストの形式が正しくありません。再度お試しください。" },
			{ status: 400 }
		);
	}

	const { message, articleContent } = body;

	// 2. バリデーション
	if (!message || !articleContent) {
		return NextResponse.json(
			{ error: "質問内容と記事コンテンツは必須です。入力を確認してください。" },
			{ status: 400 }
		);
	}

	if (message.length > MAX_MESSAGE_LENGTH) {
		return NextResponse.json(
			{
				error: `質問は${MAX_MESSAGE_LENGTH}文字以内で入力してください。`,
			},
			{ status: 400 }
		);
	}

	if (articleContent.length > MAX_ARTICLE_CONTENT_LENGTH) {
		return NextResponse.json(
			{ error: "記事のコンテンツが大きすぎます。" },
			{ status: 400 }
		);
	}

	// 3. Gemini APIでストリーミング生成
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		return NextResponse.json(
			{
				error: "AI機能が現在利用できません。管理者にお問い合わせください。",
			},
			{ status: 500 }
		);
	}

	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

	const systemPrompt = `あなたは以下の記事の内容についての質問に答えるアシスタントです。
記事の内容に関係のない質問には答えず、「この記事の内容についてのご質問にのみお答えできます」と返してください。
回答はユーザーの質問の言語に合わせてください。

--- 記事の内容 ---
${articleContent}
--- 記事の内容ここまで ---`;

	// 4. Gemini APIにリクエストを送信し、エラーはHTTPレスポンスとして返す
	let result: Awaited<ReturnType<typeof model.generateContentStream>>;
	try {
		result = await model.generateContentStream([systemPrompt, message]);
	} catch (error) {
		console.error("Gemini API error:", error);
		const isRateLimit = error instanceof Error && error.message.includes("429");
		return NextResponse.json(
			{
				error: isRateLimit
					? "APIのリクエスト制限に達しました。しばらく時間をおいてから再度お試しください。"
					: "AI応答の生成中にエラーが発生しました。もう一度お試しください。",
			},
			{ status: isRateLimit ? 429 : 500 }
		);
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
				controller.error(new Error("AI応答の生成中にエラーが発生しました。"));
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
