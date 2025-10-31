import type { Meta, StoryObj } from "@storybook/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fn } from "storybook/test";
import { vi } from "vitest";

import type { Article } from "@/shared/model";

import { ArticlesTable } from "./articles-table";

/**
 * APIフックのモック
 */
const { mockUseGetAllArticles, mockUseGetAllTags, mockUseDashboardOverview } =
	vi.hoisted(() => ({
		mockUseGetAllArticles: vi.fn(),
		mockUseGetAllTags: vi.fn(),
		mockUseDashboardOverview: vi.fn(),
	}));

vi.mock("@/entities/article", async () => {
	const actual =
		await vi.importActual<typeof import("@/entities/article")>(
			"@/entities/article"
		);
	return {
		...actual,
		useGetAllArticles: () => mockUseGetAllArticles(),
		useDelete: () => ({
			mutateAsync: fn(),
			isPending: false,
		}),
	};
});

vi.mock("@/entities/tag", async () => {
	const actual =
		await vi.importActual<typeof import("@/entities/tag")>("@/entities/tag");
	return {
		...actual,
		useGetAllTags: () => mockUseGetAllTags(),
	};
});

vi.mock("@/features/dashboard", async () => {
	const actual = await vi.importActual<typeof import("@/features/dashboard")>(
		"@/features/dashboard"
	);
	return {
		...actual,
		useDashboardOverview: () => mockUseDashboardOverview(),
	};
});

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

const meta: Meta<typeof ArticlesTable> = {
	component: ArticlesTable,
	parameters: {
		viewport: {
			defaultViewport: "reset",
		},
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<QueryClientProvider client={queryClient}>
				<div className="p-4">
					<Story />
				</div>
			</QueryClientProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * テスト用の記事データ
 */
const mockArticles: Article[] = [
	{
		id: 1,
		slug: "react-hooks-guide",
		title: "React Hooks完全ガイド",
		content: "React Hooksの使い方を解説します。",
		status: "published",
		updatedAt: "2024-01-15T00:00:00Z",
		publishedAt: "2024-01-10T00:00:00Z",
		viewCount: 1500,
		cfImageId: "test-image-1",
		tags: [
			{
				id: 1,
				slug: "react",
				translations: { ja: "React", en: "React" },
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
				articleCount: 5,
			},
		],
	},
	{
		id: 2,
		slug: "typescript-best-practices",
		title: "TypeScriptベストプラクティス",
		content: "TypeScriptの型安全な書き方を紹介します。",
		status: "draft",
		updatedAt: "2024-02-05T00:00:00Z",
		publishedAt: null,
		viewCount: 0,
		cfImageId: null,
		tags: [
			{
				id: 2,
				slug: "typescript",
				translations: { ja: "TypeScript", en: "TypeScript" },
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
				articleCount: 3,
			},
		],
	},
];

/**
 * デフォルト状態（記事データあり）
 */
export const Default: Story = {
	name: "デフォルト状態（記事あり）",
	tags: ["code-only"],
	args: {
		onRefresh: fn(),
	},
	beforeEach: () => {
		mockUseGetAllArticles.mockReturnValue({
			data: {
				data: mockArticles,
				pagination: {
					page: 1,
					limit: 50,
					total: 2,
					totalPages: 1,
				},
			},
			isLoading: false,
			error: null,
			refetch: fn(),
		});

		mockUseGetAllTags.mockReturnValue({
			data: {
				data: [
					{
						id: 1,
						slug: "react",
						translations: { ja: "React", en: "React" },
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
						articleCount: 5,
					},
					{
						id: 2,
						slug: "typescript",
						translations: { ja: "TypeScript", en: "TypeScript" },
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
						articleCount: 3,
					},
				],
			},
			isLoading: false,
		});

		mockUseDashboardOverview.mockReturnValue({
			data: {
				articleStats: {
					draftArticles: 1,
					publishedArticles: 1,
					archivedArticles: 0,
				},
			},
		});
	},
};

/**
 * ローディング状態
 */
export const Loading: Story = {
	name: "ローディング状態",
	tags: ["code-only"],
	args: {
		onRefresh: fn(),
	},
	beforeEach: () => {
		mockUseGetAllArticles.mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
			refetch: fn(),
		});

		mockUseGetAllTags.mockReturnValue({
			data: undefined,
			isLoading: true,
		});

		mockUseDashboardOverview.mockReturnValue({
			data: undefined,
		});
	},
};

/**
 * 空状態
 */
export const EmptyState: Story = {
	name: "空状態（記事なし）",
	tags: ["code-only"],
	args: {
		onRefresh: fn(),
	},
	beforeEach: () => {
		mockUseGetAllArticles.mockReturnValue({
			data: {
				data: [],
				pagination: {
					page: 1,
					limit: 50,
					total: 0,
					totalPages: 0,
				},
			},
			isLoading: false,
			error: null,
			refetch: fn(),
		});

		mockUseGetAllTags.mockReturnValue({
			data: {
				data: [],
			},
			isLoading: false,
		});

		mockUseDashboardOverview.mockReturnValue({
			data: {
				articleStats: {
					draftArticles: 0,
					publishedArticles: 0,
					archivedArticles: 0,
				},
			},
		});
	},
};
