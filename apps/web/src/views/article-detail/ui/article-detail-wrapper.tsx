import { notFound } from "next/navigation";
import { fetchArticle } from "../../../shared/lib/api-client";
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
	// デバッグ用ログ
	console.log("🔍 ArticleDetailWrapper Debug:", {
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		slug,
		locale,
		requestQuery: { lang: locale },
		timestamp: new Date().toISOString(),
	});

	// Service Binding の存在確認
	// @ts-ignore
	const cloudflareContext = (globalThis as any)[
		Symbol.for("__cloudflare-context__")
	];
	const hasServiceBinding = !!cloudflareContext?.env?.BACKEND_API;
	
	console.log("🔍 Service Binding Check:", {
		hasCloudflareContext: !!cloudflareContext,
		hasServiceBinding,
		envKeys: cloudflareContext?.env ? Object.keys(cloudflareContext.env) : [],
	});

	try {
		// Service Bindingを使ったAPI呼び出し
		console.log("🔍 Calling fetchArticle...", {
			method: hasServiceBinding ? "Service Binding" : "HTTP",
			slug,
			locale,
		});

		const articleResponse = await fetchArticle(slug, { lang: locale as "ja" | "en" });

		console.log("✅ Article Data Retrieved:", {
			hasData: !!articleResponse.data,
			title: articleResponse.data?.title,
			slug: articleResponse.data?.slug,
			id: articleResponse.data?.id,
			status: articleResponse.data?.status,
		});

		return <ArticleDetailView article={articleResponse.data} locale={locale} />;
	} catch (error) {
		console.error("❌ Failed to fetch article:", {
			error,
			message: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : "No stack",
			slug,
			locale,
			timestamp: new Date().toISOString(),
		});
		
		// APIエラーの詳細を出力
		if (error instanceof Error && 'status' in error) {
			console.error("❌ API Error Details:", {
				status: (error as any).status,
				code: (error as any).code,
			});
		}
		
		notFound();
	}
}
