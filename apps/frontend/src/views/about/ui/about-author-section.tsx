"use client";

import { useTranslations } from "next-intl";

/**
 * 「saneatsuについて」セクションを表示するコンポーネント
 *
 * @description
 * プロフィール、趣味・興味関心、経歴サマリー、ビジョンを表示する。
 */
export function AboutAuthorSection() {
	const t = useTranslations("about.author");

	return (
		<section className="space-y-6 pb-12 border-b">
			<h2 className="text-2xl font-bold">{t("title")}</h2>

			<div className="space-y-6">
				{/* プロフィール */}
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">{t("profile.title")}</h3>
					<p className="text-muted-foreground">{t("profile.content")}</p>
					<p className="text-muted-foreground">{t("profile.location")}</p>
				</div>

				{/* 趣味・興味関心 */}
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">{t("interests.title")}</h3>
					<p className="text-muted-foreground">{t("interests.tech")}</p>
					<p className="text-muted-foreground">{t("interests.hobbies")}</p>
				</div>

				{/* 経歴サマリー */}
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">{t("careerSummary.title")}</h3>
					<p className="text-muted-foreground">{t("careerSummary.role")}</p>
					<p className="text-muted-foreground">
						{t("careerSummary.expertise")}
					</p>
				</div>

				{/* ビジョン */}
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">{t("vision.title")}</h3>
					<p className="text-muted-foreground">{t("vision.content")}</p>
				</div>
			</div>
		</section>
	);
}
