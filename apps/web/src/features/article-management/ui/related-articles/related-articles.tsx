"use client";

import { useLocale, useTranslations } from "next-intl";

import { ArticleCard, useGetRelated } from "@/entities/article";

export interface RelatedArticlesProps {
	/** 現在の記事のスラッグ */
	slug: string;
	/** 取得する記事数 */
	limit?: number;
}

/**
 * 関連記事セクションコンポーネント
 *
 * @description
 * 同じタグを持つ記事を優先的に表示し、不足する場合は最新記事で補完する。
 *
 * @param props.slug - 現在の記事のスラッグ
 * @param props.limit - 取得する記事数（デフォルト: 6）
 */
export function RelatedArticles({ slug, limit = 6 }: RelatedArticlesProps) {
	const locale = useLocale();
	const t = useTranslations("article");

	const { data, isLoading, error } = useGetRelated({
		slug,
		lang: locale,
		limit,
	});

	// ローディング中
	if (isLoading) {
		return (
			<div className="grid gap-8 md:grid-cols-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={`skeleton-${
							// biome-ignore lint/suspicious/noArrayIndexKey: スケルトンなのでインデックスキーで問題ない
							i
						}`}
						className="h-64 bg-muted rounded-lg animate-pulse"
					/>
				))}
			</div>
		);
	}

	// エラー時
	if (error) {
		return (
			<div className="text-center text-sm text-muted-foreground">
				{t("relatedArticles.error")}
			</div>
		);
	}

	// データがない、または記事がない場合
	if (!data?.data || data.data.length === 0) {
		return null;
	}

	return (
		<div className="grid gap-8 md:grid-cols-2">
			{data.data.map((article) => (
				<ArticleCard key={article.id} article={article} />
			))}
		</div>
	);
}
