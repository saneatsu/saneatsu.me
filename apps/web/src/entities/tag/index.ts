/**
 * タグエンティティのエクスポート
 */

export { useCheckTagSlug } from "./api/use-check-slug";
export { type CreateTagInput, useCreateTag } from "./api/use-create";
export { useDeleteTag } from "./api/use-delete";
// API hooks
export { useGetAllTags } from "./api/use-get-all";
export {
	getTagFormInitialValues,
	type TagDetail,
	useGetTagById,
} from "./api/use-get-by-id";
export {
	createTagInputToUpdateTagInput,
	type UpdateTagInput,
	useUpdateTag,
} from "./api/use-update";
