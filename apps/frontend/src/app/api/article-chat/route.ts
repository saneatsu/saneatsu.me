import {
	type FunctionCall,
	type FunctionDeclaration,
	GoogleGenerativeAI,
	SchemaType,
} from "@google/generative-ai";
import { type NextRequest, NextResponse } from "next/server";
import type { ArticleChatErrorCode } from "@/features/article-chat/model/article-chat-error-code";
import type { LanguageCode } from "@/shared/model";

import { fetchArticleContentForChat } from "./fetch-article-content-for-chat";
import {
	type ArticleSummary,
	fetchArticlesForChat,
} from "./fetch-articles-for-chat";

/** メッセージの最大文字数（フロントエンドのi18n翻訳パラメータとしても使用するためexport） */
export const MAX_MESSAGE_LENGTH = 2_000;

/** Function Callingのループ回数上限（無限ループ防止） */
const MAX_FUNCTION_CALL_ROUNDS = 5;

/** エラーコードに型制約をかけたJSONレスポンスを生成する */
function errorResponse(error: ArticleChatErrorCode, status: number) {
	return NextResponse.json({ error }, { status });
}

/** Gemini Function Callingで使用するツール定義 */
const getArticleContentDeclaration: FunctionDeclaration = {
	name: "get_article_content",
	description:
		"Retrieve the full body (Markdown) of the article with the given slug",
	parameters: {
		type: SchemaType.OBJECT,
		properties: {
			slug: {
				type: SchemaType.STRING,
				description: "The slug of the article",
			},
		},
		required: ["slug"],
	},
};

/**
 * 記事一覧からシステムプロンプトに埋め込む文字列を生成する
 *
 * @param articles - 記事のタイトルとslugの一覧
 * @param currentArticleSlug - 現在閲覧中の記事のslug（オプショナル）
 */
function buildSystemPrompt(
	articles: ArticleSummary[],
	currentArticleSlug?: string
): string {
	const articleList = articles
		.map((a, i) => `${i + 1}. [slug: ${a.slug}] ${a.title}`)
		.join("\n");

	const currentArticleInfo = currentArticleSlug
		? `\nThe user is currently viewing "${articles.find((a) => a.slug === currentArticleSlug)?.title ?? currentArticleSlug}" (${currentArticleSlug}). Prioritize answering questions about this article.`
		: "";

	return `You are an assistant that answers questions about the blog articles listed below.
If the user's question is related to an article, use the get_article_content tool to retrieve the article body before answering.
Respond in the same language as the user's question.

--- Link Format ---
When referencing an article in your answer, always use Markdown link format: [Article Title](/blog/slug).
When referencing an external site, also use Markdown link format: [Site Name](https://example.com).
--- End of Link Format ---

--- Available Articles ---
${articleList}
--- End of Available Articles ---
${currentArticleInfo}`;
}

/**
 * Function Callの結果を処理して記事コンテンツを取得する
 *
 * @param functionCall - Geminiが返したFunction Call
 * @param language - 記事の言語
 * @returns Function Callの結果文字列
 */
async function handleFunctionCall(
	functionCall: FunctionCall,
	language: LanguageCode
): Promise<string> {
	if (functionCall.name !== "get_article_content") {
		return JSON.stringify({ error: `Unknown function: ${functionCall.name}` });
	}

	const args = functionCall.args as Record<string, unknown> | undefined;
	const slug = args?.slug as string | undefined;
	if (!slug) {
		return JSON.stringify({ error: "slug is required" });
	}

	const content = await fetchArticleContentForChat(slug, language);
	if (content === null) {
		return JSON.stringify({
			error: `Article with slug "${slug}" not found`,
		});
	}

	return content;
}

/**
 * 横断AIチャット API Route
 *
 * @description
 * 全公開記事を横断してGemini APIにFunction Calling付きでリクエストを送信する。
 *
 * 1. リクエストボディから message, currentArticleSlug, language を取得・バリデーション
 * 2. 全公開記事のタイトル・slug一覧を取得（エラー時はHTTPレスポンスとして返す）
 * 3. システムプロンプトに記事一覧を埋め込み、Gemini APIにリクエスト
 * 4. Function Callがあれば記事本文を取得して結果を返す（最大5ラウンド）
 * 5. Function Callがなくなったら最終回答をストリーミングで返す
 *
 * エラーケース:
 * - GEMINI_API_KEY 未設定: 500
 * - message 未指定または文字数超過: 400
 * - 記事一覧取得失敗: 500
 * - Gemini API レート制限: 429
 * - Gemini API その他のエラー: 500
 */
export async function POST(request: NextRequest) {
	// 1. リクエストボディのパース
	let body: {
		message?: string;
		currentArticleSlug?: string;
		language?: LanguageCode;
	};
	try {
		body = await request.json();
	} catch {
		return errorResponse("INVALID_REQUEST", 400);
	}

	const { message, currentArticleSlug, language } = body;

	// 2. バリデーション
	if (!message || !language) {
		return errorResponse("REQUIRED_FIELDS", 400);
	}

	if (message.length > MAX_MESSAGE_LENGTH) {
		return errorResponse("MESSAGE_TOO_LONG", 400);
	}

	// 3. Gemini API キーの確認
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		return errorResponse("AI_UNAVAILABLE", 500);
	}

	// 4. 全公開記事の一覧を取得
	let articles: ArticleSummary[];
	try {
		articles = await fetchArticlesForChat(language);
	} catch (error) {
		console.error("Failed to fetch articles for chat:", error);
		return errorResponse("ARTICLES_FETCH_FAILED", 500);
	}

	// 5. Geminiモデルの初期化
	const genAI = new GoogleGenerativeAI(apiKey);
	const systemPrompt = buildSystemPrompt(articles, currentArticleSlug);

	const model = genAI.getGenerativeModel({
		model: "gemini-2.5-flash",
		systemInstruction: systemPrompt,
		tools: [{ functionDeclarations: [getArticleContentDeclaration] }],
	});

	// 6. Function Callingループ（非ストリーミング）
	// Geminiが記事本文を必要とする場合、get_article_contentを呼び出して結果を返す
	// Function Callがなくなるまで繰り返す（最大MAX_FUNCTION_CALL_ROUNDS回）
	const chatHistory: Array<{
		role: "user" | "model" | "function";
		parts: Array<
			| { text: string }
			| { functionCall: FunctionCall }
			| { functionResponse: { name: string; response: { content: string } } }
		>;
	}> = [];

	chatHistory.push({
		role: "user",
		parts: [{ text: message }],
	});

	try {
		for (let round = 0; round < MAX_FUNCTION_CALL_ROUNDS; round++) {
			const result = await model.generateContent({
				contents: chatHistory,
			});

			const response = result.response;
			const candidate = response.candidates?.[0];

			if (!candidate?.content?.parts) {
				break;
			}

			// Function Callが含まれているか確認
			const functionCallPart = candidate.content.parts.find(
				(part) => "functionCall" in part && part.functionCall
			);

			if (
				!functionCallPart ||
				!("functionCall" in functionCallPart) ||
				!functionCallPart.functionCall
			) {
				// Function Callがない場合、ループを抜けてストリーミングに移行
				break;
			}

			const resolvedFunctionCall = functionCallPart.functionCall;

			// modelの応答を履歴に追加
			chatHistory.push({
				role: "model",
				parts: candidate.content.parts as Array<
					{ text: string } | { functionCall: FunctionCall }
				>,
			});

			// Function Callを処理
			const functionResult = await handleFunctionCall(
				resolvedFunctionCall,
				language
			);

			// Function Callの結果を履歴に追加
			chatHistory.push({
				role: "function",
				parts: [
					{
						functionResponse: {
							name: resolvedFunctionCall.name,
							response: { content: functionResult },
						},
					},
				],
			});
		}

		// 7. 最終回答をストリーミングで返す
		const streamResult = await model.generateContentStream({
			contents: chatHistory,
		});

		const stream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of streamResult.stream) {
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
	} catch (error) {
		console.error("Gemini API error:", error);
		const isRateLimit = error instanceof Error && error.message.includes("429");
		return isRateLimit
			? errorResponse("RATE_LIMIT_EXCEEDED", 429)
			: errorResponse("GENERATION_FAILED", 500);
	}
}
