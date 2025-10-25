import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
	title: "プライバシーポリシー | Privacy Policy",
	description: "saneatsu.meのプライバシーポリシー",
};

export default async function PrivacyPage() {
	const t = await getTranslations("Privacy");

	return (
		<div className="container mx-auto py-8 px-4 max-w-4xl">
			<h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

			<div className="prose prose-lg dark:prose-invert max-w-none text-base">
				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("introduction.title")}
					</h2>
					<p>{t("introduction.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("dataCollection.title")}
					</h2>
					<p>{t("dataCollection.content")}</p>
					<ul className="list-disc pl-6 mt-2">
						<li>{t("dataCollection.items.email")}</li>
						<li>{t("dataCollection.items.name")}</li>
						<li>{t("dataCollection.items.profile")}</li>
					</ul>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("dataUsage.title")}
					</h2>
					<p>{t("dataUsage.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("dataSecurity.title")}
					</h2>
					<p>{t("dataSecurity.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">{t("cookies.title")}</h2>
					<p>{t("cookies.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("thirdParty.title")}
					</h2>
					<p>{t("thirdParty.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">{t("contact.title")}</h2>
					<p>{t("contact.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">{t("changes.title")}</h2>
					<p>{t("changes.content")}</p>
				</section>

				<p className="text-sm text-muted-foreground mt-8">
					{t("lastUpdated")}: 2024-12-15
				</p>
			</div>
		</div>
	);
}
