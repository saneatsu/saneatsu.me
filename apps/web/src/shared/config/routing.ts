import { defaultLocale, locales } from "@saneatsu/i18n";
import { defineRouting } from "next-intl/routing";

/**
 * next-intl のルーティング設定
 *
 * @description
 * ミドルウェアとナビゲーション API で共有されるルーティング設定を定義する。
 *
 * - locales: サポートするすべてのロケールのリスト
 * - defaultLocale: ロケールが一致しない場合に使用されるデフォルトロケール
 * - localePrefix: ロケール接頭辞の表示方法
 *   - 'always': パスは常にロケール接頭辞を含む（例: /ja/blog, /en/blog）
 *   - 'as-needed': デフォルトロケールは接頭辞なし、他は接頭辞付き（例: /blog, /en/blog）
 *   - 'never': URL にロケール接頭辞を表示しない
 */
export const routing = defineRouting({
	locales,
	defaultLocale,
	localePrefix: "always", // 常にロケールプレフィックスを含める
});
