"use client";

import { useTranslations } from "next-intl";

/**
 * ブログ運営方針の文言を表示するコンポーネント
 *
 * @description
 * 「まず公開してから改善する」というブログの運営方針を表示する。
 * GitLabのドキュメント文化を参考にした透明性の高い方針を説明。
 * トップページ、ブログページ、Aboutページで共通して使用される。
 */
export function BlogNotice() {
	const t = useTranslations("common.blogNotice");

	return (
		<div className="text-sm text-muted-foreground space-y-3 py-2">
			{/* 運営方針の箇条書き */}
			<ul className="space-y-2 list-disc list-inside pl-2">
				<li>{t("principle1")}</li>
				<li>
					{t("principle3")}
					<br />
					<a
						href="https://amzn.to/3Jlh03B"
						target="_blank"
						rel="noopener noreferrer"
						className="underline decoration-dotted ml-6 inline-flex items-center gap-1"
					>
						ref: {t("bookLink")} | Amazon
					</a>
				</li>
			</ul>
		</div>
	);
}
