import type { GenerativeModel } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * 翻訳先の言語コード
 *
 * @description
 * 翻訳元は常に日本語（ja）なので、翻訳先の言語のみを型で表現する。
 * サイトのサポート言語（@saneatsu/i18n の locales）から日本語を除いたもの。
 */
export type TargetLanguage = "en" | "es";

/**
 * 翻訳先言語コードと、プロンプトで使う言語名の対応表
 *
 * @description
 * Gemini へのプロンプトは英語ではなく「自然な◯◯語に翻訳して」と
 * 言語名で指示するため、コードから表示名への変換表を持つ。
 */
const TARGET_LANGUAGE_NAMES: Record<TargetLanguage, string> = {
	en: "英語",
	es: "スペイン語",
};

/**
 * Gemini APIを使った翻訳サービス
 *
 * @description
 * - 記事（タイトル・本文）の翻訳: Markdown形式を保持した日本語→多言語翻訳
 * - タグ名の翻訳: 適切な英語（スラッグ用）表現への変換
 *
 * 翻訳元は常に日本語で、翻訳先は `TargetLanguage`（英語・スペイン語など）を指定する。
 */
export class GeminiTranslationService {
	private genAI: GoogleGenerativeAI;
	private model: GenerativeModel;

	constructor(apiKey: string) {
		this.genAI = new GoogleGenerativeAI(apiKey);
		// Gemini 2.5 Flashモデルを使用（高速・低コスト）
		this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
	}

	/**
	 * 記事の翻訳プロンプトを生成
	 * @param title - 記事のタイトル
	 * @param content - 記事の本文（Markdown形式）
	 * @param targetLanguage - 翻訳先の言語コード
	 * @returns 翻訳用プロンプト
	 */
	private createTranslationPrompt(
		title: string,
		content: string,
		targetLanguage: TargetLanguage
	): string {
		const languageName = TARGET_LANGUAGE_NAMES[targetLanguage];
		return `以下の日本語の記事を${languageName}に翻訳してください。

重要な条件：
1. Markdown記法を完全に保持してください（見出し、リスト、リンク、コードブロック、表など）
2. [[記事名]] のようなWikiLink記法はそのまま保持してください
3. コードブロック内のコードは翻訳しないでください
4. URLやファイルパスは変更しないでください
5. 自然で読みやすい${languageName}にしてください
6. 専門用語は適切な${languageName}表現を使用してください

翻訳する記事：
タイトル: ${title}

本文:
${content}

以下の形式で出力してください：
TITLE: [翻訳されたタイトル]
CONTENT:
[翻訳された本文]`;
	}

	/**
	 * 記事を日本語から指定言語に翻訳
	 * @param title - 日本語のタイトル
	 * @param content - 日本語の本文
	 * @param targetLanguage - 翻訳先の言語コード（省略時は英語）
	 * @returns 翻訳結果（タイトルと本文）
	 */
	async translateArticle(
		title: string,
		content: string,
		targetLanguage: TargetLanguage = "en"
	): Promise<{ title: string; content: string } | null> {
		try {
			// 翻訳プロンプトを生成
			const prompt = this.createTranslationPrompt(
				title,
				content,
				targetLanguage
			);

			// Gemini APIを呼び出し
			const result = await this.model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();

			// レスポンスをパース
			const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|$)/);
			const contentMatch = text.match(/CONTENT:\s*([\s\S]+)/);

			if (!titleMatch || !contentMatch) {
				console.error("Failed to parse translation response");
				return null;
			}

			return {
				title: titleMatch[1].trim(),
				content: contentMatch[1].trim(),
			};
		} catch (error) {
			console.error("Translation failed:", error);
			// エラーが発生しても処理を続行（翻訳なしで記事を保存）
			return null;
		}
	}

	/**
	 * タグ名の翻訳プロンプトを生成
	 * @param tagName - タグ名
	 * @returns 翻訳用プロンプト
	 */
	private createTagTranslationPrompt(tagName: string): string {
		return `以下の日本語のタグ名を英語に翻訳してください。

重要な条件：
1. タグ名として適切な英語表現を使用してください
2. スペースは使用せず、ケバブケースまたはキャメルケースにしてください
3. 1単語または複数単語を繋げた形式で出力してください
4. 記号や特殊文字は使用しないでください

翻訳するタグ名: ${tagName}

英語のタグ名のみを出力してください（説明や追加テキストは不要）:`;
	}

	/**
	 * タグ名を日本語から英語に翻訳
	 * @param tagName - 日本語のタグ名
	 * @returns 翻訳された英語タグ名（失敗時はnull）
	 */
	async translateTag(tagName: string): Promise<string | null> {
		try {
			// 翻訳プロンプトを生成
			const prompt = this.createTagTranslationPrompt(tagName);

			// Gemini APIを呼び出し
			const result = await this.model.generateContent(prompt);
			const response = await result.response;
			const text = response.text().trim();

			// レスポンスが空の場合はnullを返す
			if (!text) {
				console.error("Translation response is empty");
				return null;
			}

			return text;
		} catch (error) {
			console.error("Tag translation failed:", error);
			// エラーが発生しても処理を続行（翻訳なしで保存）
			return null;
		}
	}

	/**
	 * 翻訳が必要かどうかを判定
	 * @param originalContent - オリジナルコンテンツ
	 * @param existingTranslation - 既存の翻訳
	 * @returns 翻訳が必要な場合true
	 */
	shouldTranslate(
		originalContent: string,
		existingTranslation?: string | null
	): boolean {
		// 既存の翻訳がない場合は翻訳が必要
		if (!existingTranslation) return true;

		// TODO: より高度な差分検出を実装（将来的な改善）
		// 現在は単純に文字列比較
		return originalContent !== existingTranslation;
	}

	/**
	 * バッチ翻訳（複数の記事を一括翻訳）
	 * @param articles - 翻訳する記事の配列
	 * @returns 翻訳結果の配列
	 */
	async translateBatch(
		articles: Array<{ title: string; content: string }>
	): Promise<Array<{ title: string; content: string } | null>> {
		// レート制限を考慮して順次処理（将来的には並列処理も検討）
		const results = [];
		for (const article of articles) {
			const result = await this.translateArticle(
				article.title,
				article.content
			);
			results.push(result);
			// レート制限対策（1秒待機）
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		return results;
	}
}

/**
 * Cloudflare Workers環境用のファクトリー関数
 * @param env - Cloudflare Workers環境変数
 * @returns GeminiTranslationServiceインスタンス
 */
export function createTranslationService(env: {
	GEMINI_API_KEY: string;
}): GeminiTranslationService {
	if (!env.GEMINI_API_KEY) {
		throw new Error("GEMINI_API_KEY is not configured");
	}
	return new GeminiTranslationService(env.GEMINI_API_KEY);
}
