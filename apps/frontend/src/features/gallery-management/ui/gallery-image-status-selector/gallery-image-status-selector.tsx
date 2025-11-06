import type { GalleryImageStatus } from "@/shared/model";
import { GALLERY_IMAGE_STATUS_CONFIG } from "@/shared/model";
import { Badge, Label, RadioGroup, RadioGroupItem } from "@/shared/ui";

/**
 * ギャラリー画像ステータス選択コンポーネントのProps
 */
interface GalleryImageStatusSelectorProps {
	/** 現在選択されているステータス */
	value: GalleryImageStatus;
	/** ステータス変更時のコールバック */
	onValueChange: (value: GalleryImageStatus) => void;
	/** 表示するステータスのリスト */
	statuses: ReadonlyArray<GalleryImageStatus>;
	/** エラーメッセージ */
	error?: string;
	/** ラベルテキスト */
	label?: string;
	/** 必須マークを表示するか */
	required?: boolean;
}

/**
 * ギャラリー画像ステータス選択コンポーネント
 *
 * @description
 * ギャラリー画像の公開ステータスを選択するためのRadioGroupコンポーネント。
 * Badgeコンポーネントを使用して視覚的にわかりやすいUI。
 * 選択されていないステータスは透明度を下げて点線ボーダーで表示。
 *
 * @example
 * // 新規作成フォーム（draft のみ）
 * <GalleryImageStatusSelector
 *   value={watchStatus}
 *   onValueChange={(value) => setValue("status", value)}
 *   statuses={["draft"]}
 *   label="公開ステータス"
 *   required
 *   error={errors.status?.message}
 * />
 *
 * @example
 * // 編集フォーム（全ステータス）
 * <GalleryImageStatusSelector
 *   value={watchStatus}
 *   onValueChange={(value) => setValue("status", value)}
 *   statuses={["draft", "published"]}
 *   label="ステータス"
 *   required
 *   error={errors.status?.message}
 * />
 */
export function GalleryImageStatusSelector({
	value,
	onValueChange,
	statuses,
	error,
	label = "ステータス",
	required = false,
}: GalleryImageStatusSelectorProps) {
	return (
		<div className="space-y-2">
			<Label className={required ? "required" : ""}>{label}</Label>
			<RadioGroup value={value} onValueChange={onValueChange}>
				<div className="flex gap-3">
					{statuses.map((status) => {
						const config = GALLERY_IMAGE_STATUS_CONFIG[status];
						const isSelected = value === status;
						// 選択されていない場合、または値が空の場合に点線ボーダーを表示
						const shouldShowDashed = !value || !isSelected;
						return (
							<div key={status} className="relative">
								<RadioGroupItem
									value={status}
									id={status}
									className="sr-only peer"
								/>
								<Label htmlFor={status} className="cursor-pointer">
									<Badge
										variant={config.variant}
										className={
											isSelected
												? "!border-2 !border-black/10 dark:!border-white/30"
												: shouldShowDashed
													? "!border-2 !border-dashed !border-current opacity-60 hover:opacity-80 transition-opacity"
													: ""
										}
									>
										{config.label}
									</Badge>
								</Label>
							</div>
						);
					})}
				</div>
			</RadioGroup>
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}
