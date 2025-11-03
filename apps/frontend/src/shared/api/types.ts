export interface Article {
	id: number;
	slug: string;
	cfImageId: string | null;
	status: "draft" | "published";
	publishedAt: string | null;
	title: string;
	content: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface ApiError {
	error: {
		code: string;
		message: string;
	};
}
