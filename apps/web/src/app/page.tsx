import { defaultLocale } from "@saneatsu/i18n";
import { redirect } from "next/navigation";

/**
 * ルートページ
 *
 * @description
 * デフォルトロケールのホームページへリダイレクトする。
 */
export default function RootPage() {
	redirect(`/${defaultLocale}`);
}
