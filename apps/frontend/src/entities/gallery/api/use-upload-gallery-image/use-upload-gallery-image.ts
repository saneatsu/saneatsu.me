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
			// 有効な値のみを含むFormDataを動的に構築
			// undefinedの値はFormDataに含めない（文字列"undefined"として送信されるのを防ぐ）
			const formData = {
				file: data.file,
				titleJa: data.titleJa,
				...(data.descriptionJa && { descriptionJa: data.descriptionJa }),
				...(data.latitude !== undefined &&
					!Number.isNaN(data.latitude) && {
						latitude: data.latitude.toString(),
					}),
				...(data.longitude !== undefined &&
					!Number.isNaN(data.longitude) && {
						longitude: data.longitude.toString(),
					}),
				...(data.takenAt && { takenAt: data.takenAt }),
			};

			const response = await client.api.gallery.$post({
				form: formData,
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
