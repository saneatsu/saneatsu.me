/**
 * スラッグ（URL用文字列）のバリデーション定義
 *
 * スラッグは小文字英数字とハイフンのみ使用可能。
 * ハイフン始まり・終わり・連続ハイフンは禁止。
 */

/**
 * スラッグの正規表現パターン
 *
 * 許可: `typescript`, `next14`, `web-development`, `my-tag-123`
 * 禁止: `-foo`, `foo-`, `foo--bar`, `TypeScript`, `web_dev`
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
