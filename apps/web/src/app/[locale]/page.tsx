import { notFound } from "next/navigation";

export default function LocalePage() {
	// [locale]ルートは使用しない - 404を返す
	notFound();
}