/**
 * タグエンティティのエクスポート
 */

// API hooks
export { useGetAllTags } from "./api/use-get-all";
export { useCreateTag, type CreateTagInput } from "./api/use-create";
export { useCheckTagSlug } from "./api/use-check-slug";

// 将来的に追加予定のエクスポート
// export { useGetTag } from "./api/use-get-by-id";
// export { useUpdateTag } from "./api/use-update";
// export { useDeleteTag } from "./api/use-delete";