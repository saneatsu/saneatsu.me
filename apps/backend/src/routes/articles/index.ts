import { OpenAPIHono } from "@hono/zod-openapi";
// ハンドラーをimport
import { checkSlug } from "./handlers/check-slug/check-slug";
// ルート定義をimport
import { checkSlugRoute } from "./handlers/check-slug/check-slug.openapi";
import { createArticle } from "./handlers/create-article/create-article";
import { createArticleRoute } from "./handlers/create-article/create-article.openapi";
import { getArticle } from "./handlers/get-article/get-article";
import { getArticleRoute } from "./handlers/get-article/get-article.openapi";
import { getArticleById } from "./handlers/get-article-by-id/get-article-by-id";
import { getArticleByIdRoute } from "./handlers/get-article-by-id/get-article-by-id.openapi";
import { getSuggestions } from "./handlers/get-suggestions/get-suggestions";
import { getSuggestionsRoute } from "./handlers/get-suggestions/get-suggestions.openapi";
import { listArticles } from "./handlers/list-articles/list-articles";
import { listArticlesRoute } from "./handlers/list-articles/list-articles.openapi";
import { updateArticle } from "./handlers/update-article/update-article";
import { updateArticleRoute } from "./handlers/update-article/update-article.openapi";
import { updateStatus } from "./handlers/update-status/update-status";
import { updateStatusRoute } from "./handlers/update-status/update-status.openapi";

/**
 * Cloudflare Workers環境の型定義
 */
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	GEMINI_API_KEY?: string;
};

/**
 * 記事関連のAPIルート
 */
export const articlesRoute = new OpenAPIHono<{ Bindings: Env }>();

// 記事一覧取得
articlesRoute.openapi(listArticlesRoute, listArticles);

// スラッグ重複チェック
articlesRoute.openapi(checkSlugRoute, checkSlug);

// サジェスト取得
articlesRoute.openapi(getSuggestionsRoute, getSuggestions);

// 記事詳細取得（公開用）
articlesRoute.openapi(getArticleRoute, getArticle);

// 管理画面用記事詳細取得
articlesRoute.openapi(getArticleByIdRoute, getArticleById);

// 記事作成
articlesRoute.openapi(createArticleRoute, createArticle);

// 記事更新
articlesRoute.openapi(updateArticleRoute, updateArticle);

// 記事ステータス更新
articlesRoute.openapi(updateStatusRoute, updateStatus);
