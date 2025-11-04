"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { extractErrorMessage, queryKeys, useHonoClient } from "@/shared/lib";

import type {
	GalleryImageUploadRequest,
	GalleryImageUploadResponse,
} from "../../model/types";

/**
 * ギャラリー画像をアップロードするカスタムフック
 *
 * @returns ギャラリー画像アップロード用のmutationオブジェクト
 *
 * @example
 * ```tsx
 * const uploadImage = useUploadGalleryImage();
 *
 * const handleSubmit = async (data: GalleryImageUploadRequest) => {
 *   try {
 *     const result = await uploadImage.mutateAsync(data);
 *     toast.success("画像をアップロードしました");
 *     router.push("/admin/gallery");
 *   } catch (error) {
 *     toast.error("画像のアップロードに失敗しました");
 *   }
 * };
 * ```
 */
export function useUploadGalleryImage() {
	const queryClient = useQueryClient();
	const client = useHonoClient();

	return useMutation({
		mutationFn: async (
			data: GalleryImageUploadRequest
		): Promise<GalleryImageUploadResponse> => {
			const response = await client.api.gallery.$post({
				form: {
					file: data.file,
					titleJa: data.titleJa,
					descriptionJa: data.descriptionJa,
					latitude: data.latitude?.toString(),
					longitude: data.longitude?.toString(),
					takenAt: data.takenAt,
				},
			});

			if (!response.ok) {
				const error = await response.json();
				const errorMessage = extractErrorMessage(
					error,
					"ギャラリー画像のアップロードに失敗しました"
				);
				throw new Error(errorMessage);
			}

			return await response.json();
		},
		onSuccess: () => {
			// ギャラリー画像一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.gallery.all(),
			});
		},
		onError: (error) => {
			console.error("Failed to upload gallery image:", error);
		},
	});
}
