"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * 「このブログについて」セクションを表示するコンポーネント
 *
 * @description
 * ブログの目的、歴史、運営方針を表示する。
 * 運営方針は旧BlogNoticeの内容を統合したもの。
 */
export function AboutBlogSection() {
	const t = useTranslations("about.blog");

	// 翻訳ファイルからブログの目的リストを取得
	const purposeItems: string[] = t.raw("purpose.items") as string[];

	return (
		<section className="space-y-6 pb-12 border-b">
			<h2 className="text-2xl font-bold">{t("title")}</h2>

			<div className="space-y-6">
				{/* ブログの目的 */}
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">{t("purpose.title")}</h3>
					<ul className="list-disc list-inside space-y-1 text-muted-foreground">
						{purposeItems.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>

				{/* ブログの歴史 */}
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">{t("history.title")}</h3>
					<p className="text-muted-foreground">{t("history.content")}</p>
				</div>

				{/* 運営方針 */}
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">{t("policy.title")}</h3>
					<div className="space-y-3 text-muted-foreground">
						<p>{t("policy.principle1")}</p>
						<p>
							{t("policy.principle2")}
							{" - "}
							<a
								href="https://www.amazon.co.jp/dp/4798170577"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 text-primary hover:underline"
							>
								{t("policy.bookLink")}
								<ExternalLink className="h-3 w-3" />
							</a>
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
