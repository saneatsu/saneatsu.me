type FetchOptions = RequestInit & {
	params?: Record<string, string | number | boolean>;
};

class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private async request<T>(
		endpoint: string,
		options: FetchOptions = {}
	): Promise<T> {
		const { params, ...fetchOptions } = options;

		let url = `${this.baseUrl}${endpoint}`;

		if (params) {
			const searchParams = new URLSearchParams();
			Object.entries(params).forEach(([key, value]) => {
				searchParams.append(key, String(value));
			});
			url += `?${searchParams.toString()}`;
		}

		const response = await fetch(url, {
			...fetchOptions,
			headers: {
				"Content-Type": "application/json",
				...fetchOptions.headers,
			},
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}`);
		}

		return response.json() as Promise<T>;
	}

	get<T>(endpoint: string, options?: FetchOptions) {
		return this.request<T>(endpoint, { ...options, method: "GET" });
	}

	post<T>(endpoint: string, data?: unknown, options?: FetchOptions) {
		return this.request<T>(endpoint, {
			...options,
			method: "POST",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	put<T>(endpoint: string, data?: unknown, options?: FetchOptions) {
		return this.request<T>(endpoint, {
			...options,
			method: "PUT",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	delete<T>(endpoint: string, options?: FetchOptions) {
		return this.request<T>(endpoint, { ...options, method: "DELETE" });
	}
}

// Create a singleton instance
export const apiClient = new ApiClient(
	process.env.NEXT_PUBLIC_API_URL || "/api"
);
