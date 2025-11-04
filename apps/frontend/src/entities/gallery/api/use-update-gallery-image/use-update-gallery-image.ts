"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";

import type {
	GalleryImageUpdateRequest,
	GalleryImageUpdateResponse,
} from "../../model/types";

/**
 * ギャラリー画像を更新するカスタムフック
 *
 * @returns ギャラリー画像更新用のmutationオブジェクト
 *
 * @example
 * ```tsx
 * const updateImage = useUpdateGalleryImage();
 *
 * const handleSubmit = async (id: number, data: GalleryImageUpdateRequest) => {
 *   try {
 *     await updateImage.mutateAsync({ id, data });
 *     toast.success("画像を更新しました");
 *   } catch (error) {
 *     toast.error("画像の更新に失敗しました");
 *   }
 * };
 * ```
 */
export function useUpdateGalleryImage() {
	const queryClient = useQueryClient();
	const client = useHonoClient();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: number;
			data: GalleryImageUpdateRequest;
		}): Promise<GalleryImageUpdateResponse> => {
			const response = await client.api.gallery[":id"].$patch({
				param: { id: id.toString() },
				json: data,
			});

			if (!response.ok) {
				const error = await response.json();
				const errorMessage = extractErrorMessage(
					error,
					"ギャラリー画像の更新に失敗しました"
				);
				throw new Error(errorMessage);
			}

			return await response.json();
		},
		onSuccess: (_, { id }) => {
			// ギャラリー画像一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.gallery.all(),
			});
			// 個別のギャラリー画像のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.gallery.byId(id),
			});
		},
		onError: (error) => {
			console.error("Failed to update gallery image:", error);
		},
	});
}
