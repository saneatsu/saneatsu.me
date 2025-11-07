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
 * @description
 * JSONまたはFormDataを使用してギャラリー画像を更新します。
 * - JSON: メタデータのみ更新（翻訳、位置情報、撮影日時、ステータス）
 * - FormData: 画像ファイルの置き換え + メタデータ更新
 *
 * @returns ギャラリー画像更新用のmutationオブジェクト
 *
 * @example
 * ```tsx
 * const updateImage = useUpdateGalleryImage();
 *
 * // メタデータのみ更新（JSON）
 * await updateImage.mutateAsync({
 *   id: 1,
 *   data: { translations: [...], latitude: 35.6812, longitude: 139.7671 }
 * });
 *
 * // 画像ファイルも置き換え（FormData）
 * const formData = new FormData();
 * formData.append("file", croppedFile);
 * formData.append("latitude", "35.6812");
 * await updateImage.mutateAsync({ id: 1, data: formData });
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
			data:
				| GalleryImageUpdateRequest
				| (Record<string, string | File> & { file: File });
		}): Promise<GalleryImageUpdateResponse> => {
			// FormDataの場合（fileフィールドがある場合）
			if ("file" in data && data.file instanceof File) {
				// Hono client の $patch は form パラメータの型定義がないが、実行時には動作する
				// biome-ignore lint/suspicious/noExplicitAny: 型定義の制限を回避するため
				const response = await (client.api.gallery[":id"].$patch as any)({
					param: { id: id.toString() },
					form: data,
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
			}

			// JSONの場合（既存の処理）
			// Hono client の $patch は json パラメータの型定義がないが、実行時には動作する
			// biome-ignore lint/suspicious/noExplicitAny: 型定義の制限を回避するため
			const response = await (client.api.gallery[":id"].$patch as any)({
				param: { id: id.toString() },
				json: data as GalleryImageUpdateRequest,
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
