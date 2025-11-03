import { useMutation, useQueryClient } from "@tanstack/react-query";

import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";
import type { TagUpdateRequest } from "@/shared/model";

/**
 * タグ更新フック
 *
 * @description
 * PUT /api/tags/:id でタグを更新するためのReact Query mutation。
 *
 * 処理フロー:
 * 1. タグIDとスラッグを受け取る
 * 2. APIリクエストを送信
 * 3. 成功時にタグ一覧のキャッシュを無効化
 * 4. エラー時にログ出力
 *
 * @example
 * const updateMutation = useUpdateTag();
 * await updateMutation.mutateAsync({ id: 1, slug: "new-slug" });
 */
export function useUpdateTag() {
	const queryClient = useQueryClient();
	const client = useHonoClient();

	return useMutation({
		mutationFn: async (data: TagUpdateRequest & { id: number }) => {
			const response = await client.api.tags[":id"].$put({
				param: { id: String(data.id) },
				json: {
					name: data.name,
					enName: data.enName,
					slug: data.slug,
				},
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(extractErrorMessage(error, "タグの更新に失敗しました"));
			}

			return await response.json();
		},
		onSuccess: () => {
			// タグ一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({
				queryKey: queryKeys.tag.all(),
			});
		},
		onError: (error) => {
			console.error("Failed to update tag:", error);
		},
	});
}
