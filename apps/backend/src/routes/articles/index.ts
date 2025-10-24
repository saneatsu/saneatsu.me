import { OpenAPIHono } from "@hono/zod-openapi";

import type { Env } from "@/types/env";
// ハンドラーをimport
import { checkSlug } from "./handlers/check-slug/check-slug";
// ルート定義をimport
import { checkSlugRoute } from "./handlers/check-slug/check-slug.openapi";
import { createArticle } from "./handlers/create-article/create-article";
import { createArticleRoute } from "./handlers/create-article/create-article.openapi";
import { deleteThumbnail } from "./handlers/delete-thumbnail/delete-thumbnail";
import { deleteThumbnailRoute } from "./handlers/delete-thumbnail/delete-thumbnail.openapi";
import { getAllArticles } from "./handlers/get-all-articles/get-all-articles";
import { getAllArticlesRoute } from "./handlers/get-all-articles/get-all-articles.openapi";
import { getArticle } from "./handlers/get-article/get-article";
import { getArticleRoute } from "./handlers/get-article/get-article.openapi";
import { getArticleById } from "./handlers/get-article-by-id/get-article-by-id";
import { getArticleByIdRoute } from "./handlers/get-article-by-id/get-article-by-id.openapi";
import { getSuggestions } from "./handlers/get-suggestions/get-suggestions";
import { getSuggestionsRoute } from "./handlers/get-suggestions/get-suggestions.openapi";
import { updateArticle } from "./handlers/update-article/update-article";
import { updateArticleRoute } from "./handlers/update-article/update-article.openapi";
import { updateStatus } from "./handlers/update-status/update-status";
import { updateStatusRoute } from "./handlers/update-status/update-status.openapi";
import { uploadThumbnail } from "./handlers/upload-thumbnail/upload-thumbnail";
import { uploadThumbnailRoute } from "./handlers/upload-thumbnail/upload-thumbnail.openapi";

/**
 * 記事関連のAPIルート
 */
export const articlesRoute = new OpenAPIHono<{ Bindings: Env }>();

// 記事一覧取得
articlesRoute.openapi(getAllArticlesRoute, getAllArticles);

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

// サムネイル画像アップロード
articlesRoute.openapi(uploadThumbnailRoute, uploadThumbnail);

// サムネイル画像削除
articlesRoute.openapi(deleteThumbnailRoute, deleteThumbnail);
