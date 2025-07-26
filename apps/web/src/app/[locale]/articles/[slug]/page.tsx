import { notFound } from "next/navigation";

export default function LocaleArticlePage() {
	// [locale]ルートは使用しない - 404を返す
	notFound();
}