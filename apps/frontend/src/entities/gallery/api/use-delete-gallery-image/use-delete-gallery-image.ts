"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";
import type { GalleryImageDeleteResponse } from "../../model/types";

/**
 * ギャラリー画像を削除するカスタムフック
 *
 * @returns ギャラリー画像削除用のmutationオブジェクト
 *
 * @example
 * ```tsx
 * const deleteImage = useDeleteGalleryImage();
 *
 * const handleDelete = async (id: number) => {
 *   if (!confirm("この画像を削除してもよろしいですか？")) return;
 *
 *   try {
 *     await deleteImage.mutateAsync(id);
 *     toast.success("画像を削除しました");
 *   } catch (error) {
 *     toast.error("画像の削除に失敗しました");
 *   }
 * };
 * ```
 */
export function useDeleteGalleryImage() {
	const queryClient = useQueryClient();
	const client = useHonoClient();

	return useMutation({
		mutationFn: async (id: number): Promise<GalleryImageDeleteResponse> => {
			const response = await client.api.gallery[":id"].$delete({
				param: { id: id.toString() },
			});

			if (!response.ok) {
				const error = await response.json();
				const errorMessage = extractErrorMessage(
					error,
					"ギャラリー画像の削除に失敗しました"
				);
				throw new Error(errorMessage);
			}

			return await response.json();
		},
		onSuccess: (_, id) => {
			// ギャラリー画像一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.gallery.all(),
			});
			// 個別のギャラリー画像のキャッシュを削除
			queryClient.removeQueries({
				queryKey: queryKeys.gallery.byId(id),
			});
		},
		onError: (error) => {
			console.error("Failed to delete gallery image:", error);
		},
	});
}
