import { ARTICLE_STATUS_CONFIG, type ArticleStatus } from "@/shared/model";
import { Badge, Label, RadioGroup, RadioGroupItem } from "@/shared/ui";

/**
 * 記事ステータス選択コンポーネントのProps
 */
interface ArticleStatusSelectorProps {
	/** 現在選択されているステータス */
	value: ArticleStatus;
	/** ステータス変更時のコールバック */
	onValueChange: (value: ArticleStatus) => void;
	/** 表示するステータスのリスト */
	statuses: ReadonlyArray<ArticleStatus>;
	/** エラーメッセージ */
	error?: string;
	/** ラベルテキスト */
	label?: string;
	/** 必須マークを表示するか */
	required?: boolean;
}

/**
 * 記事ステータス選択コンポーネント
 *
 * @description
 * 記事の公開ステータスを選択するためのRadioGroupコンポーネント。
 * Badgeコンポーネントを使用して視覚的にわかりやすいUI。
 * 選択されていないステータスは透明度を下げて点線ボーダーで表示。
 *
 * @example
 * // 新規作成フォーム（draft と published のみ）
 * <ArticleStatusSelector
 *   value={watchStatus}
 *   onValueChange={(value) => setValue("status", value)}
 *   statuses={["draft", "published"]}
 *   label="公開ステータス"
 *   required
 *   error={errors.status?.message}
 * />
 *
 * @example
 * // 編集フォーム（全ステータス）
 * <ArticleStatusSelector
 *   value={watchStatus}
 *   onValueChange={(value) => setValue("status", value)}
 *   statuses={["draft", "published", "archived"]}
 *   label="ステータス"
 *   required
 *   error={errors.status?.message}
 * />
 */
export function ArticleStatusSelector({
	value,
	onValueChange,
	statuses,
	error,
	label = "ステータス",
	required = false,
}: ArticleStatusSelectorProps) {
	return (
		<div className="space-y-2">
			<Label className={required ? "required" : ""}>{label}</Label>
			<RadioGroup value={value} onValueChange={onValueChange}>
				<div className="flex gap-3">
					{statuses.map((status) => {
						const config = ARTICLE_STATUS_CONFIG[status];
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
