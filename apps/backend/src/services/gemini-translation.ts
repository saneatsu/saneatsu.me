import type { GenerativeModel } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini APIを使った記事翻訳サービス
 * 日本語から英語へMarkdown形式を保持した翻訳を実行
 */
export class GeminiTranslationService {
	private genAI: GoogleGenerativeAI;
	private model: GenerativeModel;

	constructor(apiKey: string) {
		this.genAI = new GoogleGenerativeAI(apiKey);
		// Gemini 1.5 Flashモデルを使用（高速・低コスト）
		this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
	}

	/**
	 * 記事の翻訳プロンプトを生成
	 * @param title - 記事のタイトル
	 * @param content - 記事の本文（Markdown形式）
	 * @returns 翻訳用プロンプト
	 */
	private createTranslationPrompt(title: string, content: string): string {
		return `以下の日本語の記事を英語に翻訳してください。

重要な条件：
1. Markdown記法を完全に保持してください（見出し、リスト、リンク、コードブロック、表など）
2. [[記事名]] のようなWikiLink記法はそのまま保持してください
3. コードブロック内のコードは翻訳しないでください
4. URLやファイルパスは変更しないでください
5. 自然で読みやすい英語にしてください
6. 専門用語は適切な英語表現を使用してください

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
	 * 記事を日本語から英語に翻訳
	 * @param title - 日本語のタイトル
	 * @param content - 日本語の本文
	 * @returns 翻訳結果（タイトルと本文）
	 */
	async translateArticle(
		title: string,
		content: string
	): Promise<{ title: string; content: string } | null> {
		try {
			// 翻訳プロンプトを生成
			const prompt = this.createTranslationPrompt(title, content);

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
