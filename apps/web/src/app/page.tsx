import { redirect } from "next/navigation";
import { defaultLocale } from "../shared/config/locale-constants";

/**
 * ルートページ
 * 
 * @description
 * デフォルトロケールのホームページへリダイレクトする。
 */
export default function RootPage() {
	redirect(`/${defaultLocale}`);
}