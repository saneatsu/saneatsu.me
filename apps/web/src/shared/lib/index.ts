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

// Cloudflare Images
export { getCloudflareImageUrl, getOgImageUrl } from "./cloudflare-images";
// Extract Error Message
export { extractErrorMessage } from "./extract-error-message";
// Extract Headings
export {
	createNestedHeadings,
	extractHeadings,
	type HeadingItem,
	type NestedHeading,
	slugify,
} from "./extract-headings";
// Format Date
export {
	convertIsoToDatetimeLocal,
	formatRelativeDate,
	type RelativeDateResult,
} from "./format-date/format-date";
// Get Article Emoji
export { getArticleEmoji } from "./get-article-emoji";
export {
	extractImageId,
	getImageUrl,
	type ImageVariant,
} from "./get-image-url";
// Hono Hook
export { type HonoClient, useHonoClient } from "./hono/use-client";
export { usePersistentQueryStates } from "./hooks";
// Locale
export { getUserLocale, setUserLocale } from "./locale";
// Markdown to Text
export { extractDescription, markdownToPlainText } from "./markdown-to-text";
// Navigation
export { Link, redirect, usePathname, useRouter } from "./navigation";
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
// Remark Tweet
export { remarkTweet } from "./remark-tweet";
// Remark URL Card
export { remarkUrlCard } from "./remark-url-card";
// Remark Wiki Link
export { remarkWikiLink } from "./remark-wiki-link";
// React Hooks
export { useDebounce } from "./use-debounce";
export { useIsMobile } from "./use-mobile";

// Utils
export { cn } from "./utils";
