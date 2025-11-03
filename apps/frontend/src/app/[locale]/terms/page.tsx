import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
	title: "利用規約 | Terms of Service",
	description: "saneatsu.meの利用規約",
};

export default async function TermsPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Terms" });

	return (
		<div className="container mx-auto py-8 px-4 max-w-4xl">
			<h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

			<div className="prose prose-lg dark:prose-invert max-w-none text-base">
				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("acceptance.title")}
					</h2>
					<p>{t("acceptance.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">{t("service.title")}</h2>
					<p>{t("service.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("affiliate.title")}
					</h2>
					<p>{t("affiliate.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("externalLinks.title")}
					</h2>
					<p>{t("externalLinks.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("userObligations.title")}
					</h2>
					<p>{t("userObligations.content")}</p>
					<ul className="list-disc pl-6 mt-2">
						<li>{t("userObligations.items.lawful")}</li>
						<li>{t("userObligations.items.respectful")}</li>
						<li>{t("userObligations.items.accurate")}</li>
						<li>{t("userObligations.items.security")}</li>
					</ul>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("prohibited.title")}
					</h2>
					<p>{t("prohibited.content")}</p>
					<ul className="list-disc pl-6 mt-2">
						<li>{t("prohibited.items.illegal")}</li>
						<li>{t("prohibited.items.harmful")}</li>
						<li>{t("prohibited.items.spam")}</li>
						<li>{t("prohibited.items.unauthorized")}</li>
					</ul>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("intellectualProperty.title")}
					</h2>
					<p>{t("intellectualProperty.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("disclaimer.title")}
					</h2>
					<p>{t("disclaimer.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("limitation.title")}
					</h2>
					<p>{t("limitation.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("termination.title")}
					</h2>
					<p>{t("termination.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">
						{t("governing.title")}
					</h2>
					<p>{t("governing.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">{t("changes.title")}</h2>
					<p>{t("changes.content")}</p>
				</section>

				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">{t("contact.title")}</h2>
					<p>{t("contact.content")}</p>
				</section>

				<p className="text-sm text-muted-foreground mt-8">
					{t("lastUpdated")}: 2025-10-29
				</p>
			</div>
		</div>
	);
}
