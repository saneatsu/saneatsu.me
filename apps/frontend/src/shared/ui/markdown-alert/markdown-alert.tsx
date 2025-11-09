import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * MarkdownAlert用のvariant定義
 *
 * @description
 * GitHub互換のMarkdown Alertコンポーネント。
 * 背景色なしで、左側にvariantに応じた色のボーダーのみを表示する。
 */
const markdownAlertVariants = cva(
	"relative w-full my-4 border-l-4 pl-4 py-1 grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0 items-start [&>svg]:size-4 [&>svg]:col-start-1 [&>svg]:row-start-1 [&>svg]:translate-y-0.5 has-[>[data-slot=markdown-alert-title]]:[&_[data-slot=markdown-alert-description]]:row-start-2",
	{
		variants: {
			variant: {
				default:
					"border-l-muted-foreground text-muted-foreground [&>svg]:text-muted-foreground",
				info: "border-l-info-foreground text-info-foreground [&>svg]:text-info-foreground",
				success:
					"border-l-success-foreground text-success-foreground [&>svg]:text-success-foreground",
				warning:
					"border-l-warning-foreground text-warning-foreground [&>svg]:text-warning-foreground",
				destructive:
					"border-l-destructive text-destructive [&>svg]:text-destructive",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

/**
 * MarkdownAlertコンポーネント
 *
 * @description
 * Markdown用のAlertコンポーネント。
 * 背景色なしで、左側にカラーボーダーのみを表示する。
 */
function MarkdownAlert({
	className,
	variant,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof markdownAlertVariants>) {
	return (
		<div
			data-slot="markdown-alert"
			role="alert"
			className={cn(markdownAlertVariants({ variant }), className)}
			{...props}
		/>
	);
}

/**
 * MarkdownAlertTitleコンポーネント
 *
 * @description
 * MarkdownAlert内に表示するタイトル。
 * 太字で表示される。
 */
function MarkdownAlertTitle({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="markdown-alert-title"
			className={cn(
				"col-start-2 row-start-1 line-clamp-1 text-sm font-semibold leading-tight tracking-tight mb-2",
				className
			)}
			{...props}
		/>
	);
}

/**
 * MarkdownAlertDescriptionコンポーネント
 *
 * @description
 * MarkdownAlert内に表示する説明文。
 */
function MarkdownAlertDescription({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="markdown-alert-description"
			className={cn(
				"col-start-2 row-start-1 pt-0 text-sm [&_p]:my-0 [&_p]:text-current [&_p]:leading-relaxed",
				className
			)}
			{...props}
		/>
	);
}

export {
	MarkdownAlert,
	MarkdownAlertDescription,
	MarkdownAlertTitle,
	markdownAlertVariants,
};
