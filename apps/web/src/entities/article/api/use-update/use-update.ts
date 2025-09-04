import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { honoClient } from "../../../../shared/lib/hono-client";

type ErrorResponse = {
	error?: {
		message?: string;
	};
};

/**
 * 記事更新用フック
 *
 * @description
 * 記事を更新するフック。
 * 成功時は記事一覧へリダイレクトし、
 * キャッシュをクリアして最新データを取得する。
 */
export const useUpdate = () => {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: number;
			data: {
				title: string;
				slug: string;
				content: string;
				status: "draft" | "published" | "archived";
				publishedAt?: string;
				tagIds?: number[];
			};
		}) => {
			const response = await honoClient.api.articles[":id"].$put({
				param: { id: String(id) },
				json: data,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					(error as ErrorResponse).error?.message || "記事の更新に失敗しました"
				);
			}

			return response.json();
		},
		onSuccess: () => {
			toast.success("記事を更新しました");
			// 記事一覧と記事詳細のキャッシュをクリア
			queryClient.invalidateQueries({ queryKey: ["articles"] });
			queryClient.invalidateQueries({ queryKey: ["article"] });
			// 記事一覧ページへリダイレクト
			router.push("/admin/articles");
		},
		onError: (error: Error) => {
			toast.error(error.message || "記事の更新に失敗しました");
		},
	});
};
