// Shared Model Segment Public API

// Article
export type {
	Article,
	ArticleCreateRequest,
	ArticleCreateResponse,
	ArticleDetailQuery,
	ArticleDisplayData,
	ArticleFilters,
	ArticleResponse,
	ArticleSort,
	ArticleStatus,
	ArticlesQuery,
	ArticlesResponse,
	LanguageCode,
	RelatedArticlesResponse,
	SlugCheckQuery,
	SlugCheckResponse,
} from "./article";
export { ARTICLE_STATUS_CONFIG, LANGUAGE_CONFIG } from "./article";
// Common
export type { ApiError, PaginatedResponse, PaginationInfo } from "./common";
// Dashboard
export type {
	ArticleStats,
	DashboardOverviewRequestQuery,
	DashboardOverviewResponseData,
	DashboardStatsBackendQuery,
	DashboardStatsRequestQuery,
	DashboardStatsResponseData,
	PopularArticle,
	RecentActivityItem,
} from "./dashboard";
// Tag
export type {
	Tag,
	TagCreateRequest,
	TagCreateResponse,
	TagDeleteResponse,
	TagsResponse,
	TagUpdateRequest,
	TagUpdateResponse,
} from "./tag";
