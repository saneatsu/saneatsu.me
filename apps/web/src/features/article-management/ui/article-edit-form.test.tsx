import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArticleEditForm } from "./article-edit-form";

// Mock dependencies
vi.mock("@/entities/article", () => ({
	useUpdate: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
	})),
	useCheckSlug: vi.fn(() => ({
		data: { available: true },
		isLoading: false,
	})),
}));

vi.mock("@/entities/tag", () => ({
	useGetAllTags: vi.fn(() => ({
		data: {
			data: [
				{
					id: 1,
					slug: "test-tag",
					translations: { ja: "テストタグ", en: "Test Tag" },
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					articleCount: 0,
				},
			],
		},
		isLoading: false,
	})),
}));

vi.mock("@/features/article-editor", () => ({
	ArticleMarkdownEditor: ({
		value,
		onChange,
	}: {
		value: string;
		onChange: (value: string) => void;
	}) => (
		<textarea
			data-testid="markdown-editor"
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/shared/lib")>();
	return {
		...actual,
		useDebounce: vi.fn((value) => value),
	};
});

/**
 * テスト用のQueryClientを作成するヘルパー関数
 */
const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

/**
 * テスト用のラッパーコンポーネント
 */
const wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={createTestQueryClient()}>
		{children}
	</QueryClientProvider>
);

describe("ArticleEditForm", () => {
	describe("Unit Test", () => {
		describe("publishedAt field handling", () => {
			it("should display publishedAt value in datetime-local format when article has publishedAt in ISO 8601 format", async () => {
				// Arrange: ISO 8601形式の公開日時を持つ記事データを用意
				const article = {
					id: 1,
					title: "Test Article",
					slug: "test-article",
					content: "Test content",
					status: "published",
					publishedAt: "2024-01-15T10:30:00.000Z", // ISO 8601形式
					tags: [],
				};

				// Act: フォームをレンダリング
				render(<ArticleEditForm article={article} />, { wrapper });

				// Assert: datetime-localフィールドが正しい値を持つことを確認
				await waitFor(() => {
					const publishedAtInput = screen.getByLabelText(
						"公開日時"
					) as HTMLInputElement;

					// datetime-local形式（YYYY-MM-DDTHH:mm）に変換された値が表示されるべき
					// "2024-01-15T10:30:00.000Z" → "2024-01-15T10:30" (UTCからローカルタイムゾーンへの変換を考慮)
					expect(publishedAtInput.value).toBeTruthy();
					expect(publishedAtInput.value).toMatch(
						/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
					);
				});
			});

			it("should keep datetime-local field empty when article has null publishedAt", async () => {
				// Arrange: publishedAtがnullの記事データを用意
				const article = {
					id: 1,
					title: "Draft Article",
					slug: "draft-article",
					content: "Draft content",
					status: "published",
					publishedAt: null,
					tags: [],
				};

				// Act: フォームをレンダリング
				render(<ArticleEditForm article={article} />, { wrapper });

				// Assert: datetime-localフィールドが空であることを確認
				await waitFor(() => {
					const publishedAtInput = screen.getByLabelText(
						"公開日時"
					) as HTMLInputElement;
					expect(publishedAtInput.value).toBe("");
				});
			});
		});
	});
});
