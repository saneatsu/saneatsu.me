import { notFound } from "next/navigation";

export default function LocaleLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// [locale]ルートは使用しない - 404を返す
	notFound();
}