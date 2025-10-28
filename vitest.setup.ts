/**
 * Vitest Setup File
 *
 * @description
 * Vitestのテスト環境のセットアップファイル。
 * CSSファイルなどのリソースの処理を設定する。
 */

// CSSモジュールのインポートをグローバルにモック
// react-tweetなどのライブラリがCSSをインポートする際にエラーが出ないようにする
global.CSS = {
	// @ts-expect-error - CSSモック用の簡易実装
	escape: (str: string) => str,
	// @ts-expect-error - CSSモック用の簡易実装
	supports: () => false,
};
