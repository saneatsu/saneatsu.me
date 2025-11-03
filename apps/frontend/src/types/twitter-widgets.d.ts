/**
 * Twitter Widgets.js の型定義
 *
 * @description
 * Twitter公式のwidgets.jsライブラリの型定義。
 * グローバルなwindow.twttrオブジェクトの型を提供する。
 *
 * @see https://developer.twitter.com/en/docs/twitter-for-websites/javascript-api/overview
 */

/**
 * Twitter Widgets API のメインインターフェース
 */
interface TwitterWidgets {
	/**
	 * widgets API
	 */
	widgets: {
		/**
		 * 指定されたコンテナ内のツイート埋め込みをロードする
		 *
		 * @param element - ツイートを埋め込むコンテナ要素
		 * @returns ロード完了を示すPromise
		 */
		load(element?: HTMLElement): Promise<void>;

		/**
		 * blockquoteをツイート埋め込みに変換する
		 *
		 * @param element - blockquote要素
		 * @param options - 埋め込みオプション
		 * @returns 生成されたiframe要素
		 */
		createTweet(
			tweetId: string,
			element: HTMLElement,
			options?: TwitterEmbedOptions
		): Promise<HTMLElement | undefined>;
	};
}

/**
 * ツイート埋め込みのオプション
 */
interface TwitterEmbedOptions {
	/**
	 * テーマ（light or dark）
	 */
	theme?: "light" | "dark";

	/**
	 * 言語コード
	 */
	lang?: string;

	/**
	 * 会話のスレッドを表示するか
	 */
	conversation?: "none" | "all";

	/**
	 * カード（プレビュー）を非表示にするか
	 */
	cards?: "hidden" | "visible";

	/**
	 * 幅の指定
	 */
	width?: number | "auto";

	/**
	 * 配置（left, center, right）
	 */
	align?: "left" | "center" | "right";
}

/**
 * window.twttr のグローバル型定義
 */
declare global {
	interface Window {
		/**
		 * Twitter Widgets API
		 */
		twttr?: TwitterWidgets;
	}
}

export {};
