"use client";

import { useTranslations } from "next-intl";

import { UrlCard } from "@/entities/article";
import { AnchorHeading } from "@/shared/ui";

/**
 * aboutページで表示するおすすめ記事のURL一覧
 * 自分の思想や仕事観を伝える記事を厳選している
 */
const RECOMMENDED_ARTICLE_URLS = [
	"https://saneatsu.me/ja/blog/my-credo",
	"https://saneatsu.me/ja/blog/ideal-company-team-characteristics",
	"https://saneatsu.me/ja/blog/3-keys-to-growth-and-achievement",
	"https://saneatsu.me/ja/blog/face-the-task-dont-skip",
	"https://saneatsu.me/ja/blog/writing-is-thinking",
	"https://saneatsu.me/ja/blog/scrum-and-painting",
] as const;

/**
 * 「saneatsuについて」セクションを表示するコンポーネント
 *
 * @description
 * プロフィール、趣味・興味関心、仕事への姿勢と考え方を表示する。
 * 詳細な経歴は別セクションにあるため、プロフィールで案内を行う。
 */
export function AboutAuthorSection() {
	const t = useTranslations("about.author");
	const aboutT = useTranslations("about");

	return (
		<section className="space-y-6 pb-12 border-b">
			<AnchorHeading level="h2" id="author">
				{t("title")}
			</AnchorHeading>

			<div className="space-y-6">
				{/* プロフィール */}
				<div className="space-y-2">
					<AnchorHeading level="h3" id="author-profile">
						{t("profile.title")}
					</AnchorHeading>
					<p className="text-muted-foreground">{t("profile.content")}</p>
				</div>

				{/* 趣味・興味関心 */}
				<div className="space-y-2">
					<AnchorHeading level="h3" id="author-interests">
						{t("interests.title")}
					</AnchorHeading>
					<p className="text-muted-foreground">{t("interests.hobbies")}</p>
				</div>

				{/* 仕事への姿勢と考え方 */}
				<div className="space-y-4">
					<div className="space-y-2">
						<AnchorHeading level="h3" id="author-articles">
							{aboutT("recommendedArticles.title")}
						</AnchorHeading>
						<p className="text-muted-foreground">
							{aboutT("recommendedArticles.description")}
						</p>
					</div>
					<div className="space-y-4">
						{RECOMMENDED_ARTICLE_URLS.map((url) => (
							<UrlCard key={url} url={url} />
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
