"use client";

import { useTranslations } from "next-intl";

/**
 * ブログ運営方針を表示するセクションコンポーネント
 *
 * @description
 * 「まず公開してから改善する」というブログの運営方針を、見出し付きの独立
 * セクションとして表示する。GitLabの透明性を重視した文化を参考にしている。
 * トップページ、ブログ一覧ページで共通して使用される。
 *
 * 以前は箇条書き（ul/li）で表示していたが、記事一覧などと並ぶ独立した
 * セクションとして見せるため、見出し＋段落の構成に変更した。
 */
export function BlogNotice() {
	const t = useTranslations("common.blogNotice");

	return (
		<section className="space-y-3">
			<h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
			<div className="space-y-2 text-foreground leading-relaxed">
				{/* 運営方針: まず公開してから改善する */}
				<p>{t("principle1")}</p>
				{/* 方針の出典（GitLabの文化）と参考書籍リンク */}
				<p>
					{t("principle3")}
					<br />
					<a
						href="https://amzn.to/3Jlh03B"
						target="_blank"
						rel="noopener noreferrer"
						className="underline decoration-dotted inline-flex items-center gap-1"
					>
						ref: {t("bookLink")} | Amazon
					</a>
				</p>
			</div>
		</section>
	);
}
