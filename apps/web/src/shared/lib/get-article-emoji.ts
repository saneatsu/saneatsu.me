/**
 * 記事絵文字生成ユーティリティ
 *
 * @description
 * 記事IDから決定的なランダム絵文字を生成する。
 * 同じ記事IDは常に同じ絵文字を返すため、
 * サムネイルがない記事でも一貫した視覚的アイデンティティを持つ。
 */

/**
 * サムネイルがない記事に表示する絵文字のリスト
 *
 * @description
 * 記事やドキュメントに関連する絵文字を選定。
 * 視覚的に魅力的で、記事のイメージに合うものを選択。
 */
const ARTICLE_EMOJIS = [
	"📝", // メモ
	"📄", // ドキュメント
	"✍️", // 書く手
	"📰", // 新聞
	"📚", // 本
	"💭", // 思考バブル
	"🎯", // 的
	"📌", // ピン
	"📖", // 開いた本
	"🔖", // しおり
] as const;

/**
 * 記事IDから決定的なランダム絵文字を生成
 *
 * @description
 * 記事IDをベースにハッシュ値を計算し、
 * 絵文字リストから1つ選択する。
 * 同じ記事IDは常に同じ絵文字を返す。
 *
 * @param articleId - 記事ID（numberまたはstring）
 * @returns 絵文字文字列
 *
 * @example
 * ```typescript
 * const emoji = getArticleEmoji(123);
 * // => "📝"
 *
 * const emoji2 = getArticleEmoji("abc");
 * // => "📰"
 * ```
 */
export function getArticleEmoji(articleId: number | string): string {
	// 記事IDをベースにハッシュ値を計算
	const hash = String(articleId)
		.split("")
		.reduce((acc, char) => {
			return acc + char.charCodeAt(0);
		}, 0);

	// ハッシュ値を元に絵文字を選択
	return ARTICLE_EMOJIS[hash % ARTICLE_EMOJIS.length];
}
