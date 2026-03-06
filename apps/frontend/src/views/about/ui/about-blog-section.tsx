"use client";

import { ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AnchorHeading, MarkdownPreview } from "@/shared/ui";

/**
 * 「このブログについて」セクションを表示するコンポーネント
 *
 * @description
 * ブログの目的、歴史、運営方針を表示する。
 * 運営方針は旧BlogNoticeの内容を統合したもの。
 */
export function AboutBlogSection() {
	const t = useTranslations("about.blog");
	const locale = useLocale() as "ja" | "en";

	// 翻訳ファイルからブログの目的リストを取得
	const purposeItems: string[] = t.raw("purpose.items") as string[];

	return (
		<section className="space-y-6 pb-12 border-b">
			<AnchorHeading level="h2" id="blog">
				{t("title")}
			</AnchorHeading>

			<div className="space-y-6">
				{/* ブログの目的 */}
				<div className="space-y-2">
					<AnchorHeading level="h3" id="blog-purpose">
						{t("purpose.title")}
					</AnchorHeading>
					<ul className="list-disc list-inside space-y-1 text-muted-foreground">
						{purposeItems.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>

				{/* ブログの歴史 */}
				<div className="space-y-2">
					<AnchorHeading level="h3" id="blog-history">
						{t("history.title")}
					</AnchorHeading>
					<MarkdownPreview content={t("history.content")} language={locale} />
				</div>

				{/* 運営方針 */}
				<div className="space-y-2">
					<AnchorHeading level="h3" id="blog-policy">
						{t("policy.title")}
					</AnchorHeading>
					<div className="space-y-3 text-muted-foreground">
						<p>{t("policy.principle1")}</p>
						<p>
							{t("policy.principle2")}
							{" - "}
							<a
								href="https://amzn.to/4q6DVyI"
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
