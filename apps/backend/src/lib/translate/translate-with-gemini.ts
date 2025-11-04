import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Geminiで日本語から英語に翻訳
 *
 * @description
 * Google Gemini APIを使用して日本語テキストを英語に翻訳する。
 *
 * 処理フロー:
 * 1. GoogleGenerativeAIクライアントを初期化
 * 2. gemini-1.5-flashモデルを使用
 * 3. システムプロンプトで翻訳タスクを定義
 * 4. テキストを翻訳
 * 5. 翻訳結果を返す
 *
 * @param text - 翻訳する日本語テキスト
 * @param apiKey - Gemini API Key
 * @returns 英語に翻訳されたテキスト
 *
 * @throws APIエラーまたはレスポンスが空の場合にエラーを投げる
 *
 * @example
 * ```typescript
 * const translated = await translateWithGemini(
 *   "東京タワーの夕景",
 *   env.GEMINI_API_KEY
 * );
 * // => "Tokyo Tower at Sunset"
 * ```
 */
export async function translateWithGemini(
	text: string,
	apiKey: string
): Promise<string> {
	// 空文字列の場合は翻訳せずに返す
	if (!text || text.trim().length === 0) {
		return "";
	}

	// GoogleGenerativeAIクライアントを初期化
	const genAI = new GoogleGenerativeAI(apiKey);

	// gemini-2.5-flashモデルを使用（高速で安価、安定版）
	const model = genAI.getGenerativeModel({
		model: "gemini-2.5-flash",
		systemInstruction:
			"You are a professional translator. Translate the given Japanese text to natural English. Return only the translated text without any explanations or additional commentary.",
	});

	try {
		// テキストを翻訳
		const result = await model.generateContent(text);
		const response = result.response;
		const translatedText = response.text();

		if (!translatedText || translatedText.trim().length === 0) {
			throw new Error("Translation result is empty");
		}

		return translatedText.trim();
	} catch (error) {
		console.error("Gemini translation error:", error);
		throw new Error(
			`Failed to translate text with Gemini: ${error instanceof Error ? error.message : "Unknown error"}`
		);
	}
}

/**
 * ギャラリー画像の翻訳データ（日本語のみ）
 */
export type GalleryTranslationInput = {
	/** 日本語タイトル */
	titleJa?: string;
	/** 日本語説明 */
	descriptionJa?: string;
};

/**
 * ギャラリー画像の翻訳結果（日本語と英語）
 */
export type GalleryTranslationResult = {
	/** 日本語翻訳 */
	ja: {
		title: string | null;
		description: string | null;
	};
	/** 英語翻訳 */
	en: {
		title: string | null;
		description: string | null;
	};
};

/**
 * ギャラリー画像の翻訳データを生成
 *
 * @description
 * 日本語のタイトルと説明を受け取り、Gemini APIで英語に翻訳する。
 * 日本語と英語の両方の翻訳データを返す。
 *
 * 処理フロー:
 * 1. 日本語のタイトルと説明を受け取る
 * 2. それぞれをGemini APIで英語に翻訳
 * 3. 日本語と英語の翻訳データを返す
 *
 * @param input - 日本語の翻訳データ
 * @param apiKey - Gemini API Key
 * @returns 日本語と英語の翻訳データ
 *
 * @example
 * ```typescript
 * const translations = await translateGalleryImage(
 *   {
 *     titleJa: "東京タワーの夕景",
 *     descriptionJa: "2024年12月に東京タワーを訪れた際に撮影した写真"
 *   },
 *   env.GEMINI_API_KEY
 * );
 * // => {
 * //   ja: { title: "東京タワーの夕景", description: "..." },
 * //   en: { title: "Tokyo Tower at Sunset", description: "..." }
 * // }
 * ```
 */
export async function translateGalleryImage(
	input: GalleryTranslationInput,
	apiKey: string
): Promise<GalleryTranslationResult> {
	// 日本語タイトルと説明
	const titleJa = input.titleJa?.trim() || null;
	const descriptionJa = input.descriptionJa?.trim() || null;

	// タイトルと説明を並行翻訳
	const [titleEn, descriptionEn] = await Promise.all([
		titleJa ? translateWithGemini(titleJa, apiKey) : Promise.resolve(null),
		descriptionJa
			? translateWithGemini(descriptionJa, apiKey)
			: Promise.resolve(null),
	]);

	return {
		ja: {
			title: titleJa,
			description: descriptionJa,
		},
		en: {
			title: titleEn,
			description: descriptionEn,
		},
	};
}
