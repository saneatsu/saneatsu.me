"use client";

import { useTranslations } from "next-intl";

/**
 * 「saneatsuについて」セクションを表示するコンポーネント
 *
 * @description
 * プロフィール、趣味・興味関心を表示する。
 * 詳細な経歴は別セクションにあるため、プロフィールで案内を行う。
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
				</div>

				{/* 趣味・興味関心 */}
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">{t("interests.title")}</h3>
					<p className="text-muted-foreground">{t("interests.hobbies")}</p>
				</div>
			</div>
		</section>
	);
}
