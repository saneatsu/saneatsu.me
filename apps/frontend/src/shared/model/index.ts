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
	ContributionSummary,
	DashboardOverviewRequestQuery,
	DashboardOverviewResponseData,
	DashboardStatsBackendQuery,
	DashboardStatsRequestQuery,
	DashboardStatsResponseData,
	PopularArticle,
	RecentActivityItem,
} from "./dashboard";
// Gallery
export type {
	GalleryImage,
	GalleryImageStatus,
	GalleryImagesQuery,
	GalleryImagesResponse,
	GalleryImageTranslation,
} from "./gallery";
export { GALLERY_IMAGE_STATUS_CONFIG } from "./gallery";
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
