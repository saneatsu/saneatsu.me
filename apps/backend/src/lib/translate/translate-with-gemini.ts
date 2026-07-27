import { GoogleGenerativeAI } from "@google/generative-ai";

import type { TargetLanguage } from "../../services/gemini-translation/gemini-translation";

// 翻訳先の言語コードは gemini-translation.ts（TARGET_LANGUAGES）を単一ソースとし、
// ここでは型のみを再エクスポートして後方互換を保つ。
export type { TargetLanguage };

/**
 * 翻訳先言語ごとの Gemini システムプロンプト
 *
 * @description
 * 言語名を英語で明示することで、Gemini が自然な対象言語に翻訳できるようにする。
 * TARGET_LANGUAGES に言語を足すと、この Record が不足しビルドエラーになる。
 */
const SYSTEM_INSTRUCTION_BY_LANGUAGE: Record<TargetLanguage, string> = {
	en: "You are a professional translator. Translate the given Japanese text to natural English. Return only the translated text without any explanations or additional commentary.",
	es: "You are a professional translator. Translate the given Japanese text to natural Spanish (español). Return only the translated text without any explanations or additional commentary.",
};

/**
 * 先頭に付いた既知の言語ラベルを取り除く
 *
 * @description
 * Gemini はシステムプロンプトで「訳文のみ返す」よう指示していても、稀に
 * `SPANISH:\n訳文` のように言語ラベルを先頭に付けて返すことがある
 * （実際にタグ翻訳で `SPANISH:\nOrganización de ideas` が混入した）。
 * このラベルがそのまま DB に保存されるのを防ぐため、**既知の言語ラベルのみ**を除去する。
 * `Nota:` のような正当な本文の接頭辞を巻き込まないよう、対象ラベルは限定する。
 *
 * @param text - Gemini から返った訳文
 * @returns 先頭ラベルを除去しトリムした訳文
 */
export function stripLeadingLanguageLabel(text: string): string {
	// 例: "SPANISH:", "ESPAÑOL:", "ENGLISH:", "日本語:" など（英語/スペイン語表記の言語名）
	const leadingLanguageLabel =
		/^\s*(?:spanish|english|español|inglés|japanese|japonés)\s*[:：]\s*/i;
	return text.replace(leadingLanguageLabel, "").trim();
}

/**
 * Geminiで日本語から指定言語に翻訳
 *
 * @description
 * Google Gemini APIを使用して日本語テキストを指定した言語に翻訳する。
 *
 * 処理フロー:
 * 1. GoogleGenerativeAIクライアントを初期化
 * 2. gemini-2.5-flashモデルを使用
 * 3. 翻訳先言語に応じたシステムプロンプトで翻訳タスクを定義
 * 4. テキストを翻訳
 * 5. 翻訳結果を返す
 *
 * @param text - 翻訳する日本語テキスト
 * @param apiKey - Gemini API Key
 * @param targetLanguage - 翻訳先の言語コード（省略時は英語）
 * @returns 指定言語に翻訳されたテキスト
 *
 * @throws APIエラーまたはレスポンスが空の場合にエラーを投げる
 *
 * @example
 * ```typescript
 * const translated = await translateWithGemini(
 *   "東京タワーの夕景",
 *   env.GEMINI_API_KEY,
 *   "es"
 * );
 * // => "Torre de Tokio al atardecer"
 * ```
 */
export async function translateWithGemini(
	text: string,
	apiKey: string,
	targetLanguage: TargetLanguage = "en"
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
		systemInstruction: SYSTEM_INSTRUCTION_BY_LANGUAGE[targetLanguage],
	});

	try {
		// テキストを翻訳
		const result = await model.generateContent(text);
		const response = result.response;
		const translatedText = response.text();

		if (!translatedText || translatedText.trim().length === 0) {
			throw new Error("Translation result is empty");
		}

		// Gemini が稀に付ける先頭の言語ラベル（例: "SPANISH:"）を除去してから返す
		return stripLeadingLanguageLabel(translatedText);
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
 * 1言語分の翻訳（タイトルと説明）
 */
type GalleryTranslationText = {
	title: string | null;
	description: string | null;
};

/**
 * ギャラリー画像の翻訳結果（日本語・英語・スペイン語）
 */
export type GalleryTranslationResult = {
	/** 日本語翻訳（原文） */
	ja: GalleryTranslationText;
	/** 英語翻訳 */
	en: GalleryTranslationText;
	/** スペイン語翻訳 */
	es: GalleryTranslationText;
};

/**
 * ギャラリー画像の翻訳データを生成
 *
 * @description
 * 日本語のタイトルと説明を受け取り、Gemini APIで英語とスペイン語に翻訳する。
 * 日本語（原文）・英語・スペイン語の翻訳データを返す。
 *
 * 処理フロー:
 * 1. 日本語のタイトルと説明を受け取る
 * 2. それぞれをGemini APIで英語・スペイン語に並行翻訳する
 * 3. 日本語・英語・スペイン語の翻訳データを返す
 *
 * @param input - 日本語の翻訳データ
 * @param apiKey - Gemini API Key
 * @returns 日本語・英語・スペイン語の翻訳データ
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
 * //   en: { title: "Tokyo Tower at Sunset", description: "..." },
 * //   es: { title: "Torre de Tokio al atardecer", description: "..." }
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

	// タイトルと説明を、英語・スペイン語それぞれについて並行翻訳する
	const [titleEn, descriptionEn, titleEs, descriptionEs] = await Promise.all([
		titleJa
			? translateWithGemini(titleJa, apiKey, "en")
			: Promise.resolve(null),
		descriptionJa
			? translateWithGemini(descriptionJa, apiKey, "en")
			: Promise.resolve(null),
		titleJa
			? translateWithGemini(titleJa, apiKey, "es")
			: Promise.resolve(null),
		descriptionJa
			? translateWithGemini(descriptionJa, apiKey, "es")
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
		es: {
			title: titleEs,
			description: descriptionEs,
		},
	};
}
