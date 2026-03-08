import { useTranslations } from "next-intl";

import { ContactForm } from "@/features/contact-form";

/**
 * お問い合わせページのビューコンポーネント
 *
 * @description
 * お問い合わせフォームを表示する独立ページ。
 * フォームに適した幅（max-w-2xl）で中央配置する。
 */
export function ContactView() {
	const t = useTranslations("contact");

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="max-w-2xl mx-auto space-y-8">
				<section className="text-center space-y-2">
					<h1 className="text-4xl font-bold">{t("title")}</h1>
					<p className="text-muted-foreground">{t("description")}</p>
				</section>

				<ContactForm />
			</div>
		</main>
	);
}
