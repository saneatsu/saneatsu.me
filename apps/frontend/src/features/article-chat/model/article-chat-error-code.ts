/**
 * 記事チャットAPIが返すエラーコードの定義
 *
 * APIレスポンスとi18n翻訳キーの整合性を型レベルで担保するための単一の情報源（SSOT）。
 * エラーコードを追加・削除した場合、route.ts / use-article-chat.ts / i18n JSON のいずれかに
 * 不整合があればコンパイルエラーになる。
 */
export const ARTICLE_CHAT_ERROR_CODES = [
	"INVALID_REQUEST",
	"REQUIRED_FIELDS",
	"MESSAGE_TOO_LONG",
	"CONTENT_TOO_LARGE",
	"AI_UNAVAILABLE",
	"RATE_LIMIT_EXCEEDED",
	"GENERATION_FAILED",
] as const;

/** 記事チャットAPIが返すエラーコードのユニオン型 */
export type ArticleChatErrorCode = (typeof ARTICLE_CHAT_ERROR_CODES)[number];
