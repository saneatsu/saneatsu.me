// Shared Lib Segment Public API

// API Client
export {
	ApiClientError,
	checkSlugAvailability,
	createArticle,
	deleteArticle,
	fetchAllArticles,
	fetchArticle,
	fetchArticles,
	getErrorMessage,
	getUserByEmail,
	isApiClientError,
	updateArticleStatus,
	upsertUser,
} from "./api-client";

// Auth
export { auth } from "./auth";

// Cloudflare Images
export { getCloudflareImageUrl, getOgImageUrl } from "./cloudflare-images";

// Extract Headings
export {
	createNestedHeadings,
	extractHeadings,
	type HeadingItem,
	type NestedHeading,
	slugify,
} from "./extract-headings";
// Hono Hook
export { type HonoClient, useHonoClient } from "./hono/use-client";
// Hono Client
export { getApiBaseUrl, honoClient } from "./hono-client";

// Locale
export { getUserLocale, setUserLocale } from "./locale";

// Markdown to Text
export { extractDescription, markdownToPlainText } from "./markdown-to-text";

// Query Keys
export {
	ARTICLE_QUERY_KEYS,
	DASHBOARD_QUERY_KEYS,
	queryKeys,
} from "./query-keys";
// React Query
export {
	type ApiFnReturnType,
	type MutationConfig,
	type QueryConfig,
	queryConfig,
} from "./react-query";
// Remark Tag
export { remarkTag } from "./remark-tag";
// Remark Wiki Link
export { remarkWikiLink } from "./remark-wiki-link";
// Testing Utilities
export {
	createGetTokenMock,
	createMockNextRequest,
	expectNext,
	expectRedirect,
} from "./testing/middleware-test-utils";
// React Hooks
export { useDebounce } from "./use-debounce";
export { useIsMobile } from "./use-mobile";

// Utils
export { cn } from "./utils";
