import { notFound } from "next/navigation";
import type { ArticleResponse } from "../../../shared/types/article";
import { ArticleDetailView } from "./article-detail-view";

interface ArticleDetailWrapperProps {
	slug: string;
	locale: string;
}

/**
 * 記事詳細ビューのラッパーコンポーネント
 *
 * @description
 * 記事データの取得を行い、ArticleDetailViewに渡す。
 * サーバーコンポーネントとして動作する。
 *
 * @param props.slug - 記事のスラッグ
 * @param props.locale - 現在のロケール
 */
export async function ArticleDetailWrapper({
	slug,
	locale,
}: ArticleDetailWrapperProps) {
	// 記事データの取得
	const apiUrl =
		process.env.NODE_ENV === "development"
			? "http://localhost:8888"
			: "https://api.saneatsu.me";

	// デバッグ用ログ
	console.log("🔍 ArticleDetailWrapper Debug:", {
		NODE_ENV: process.env.NODE_ENV,
		apiUrl,
		requestUrl: `${apiUrl}/api/articles/${slug}?lang=${locale}`,
	});

	try {
		const response = await fetch(
			`${apiUrl}/api/articles/${slug}?lang=${locale}`,
			{
				next: { revalidate: 60 },
				headers: {
					"Accept-Language": locale,
				},
			}
		);

		console.log("🔍 API Response Debug:", {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok,
			url: response.url,
		});

		if (!response.ok) {
			console.error("❌ API Response Error:", {
				status: response.status,
				statusText: response.statusText,
				text: await response.text().catch(() => "Could not read response text"),
			});
			notFound();
		}

		const articleResponse: ArticleResponse = await response.json();
		console.log("✅ Article Data Retrieved:", {
			hasData: !!articleResponse.data,
			title: articleResponse.data?.title,
			slug: articleResponse.data?.slug,
		});

		return <ArticleDetailView article={articleResponse.data} locale={locale} />;
	} catch (error) {
		console.error("Failed to fetch article:", error);
		notFound();
	}
}
