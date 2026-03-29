"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const labelVariants = cva(
	"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
	VariantProps<typeof labelVariants> & {
		/** trueの場合、ラベルの右側に必須バッジを表示する */
		required?: boolean;
	};

/**
 * ラベルコンポーネント
 *
 * next-intlの `common.required` 翻訳キーを使用して必須バッジのテキストを国際化する。
 */
const Label = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	LabelProps
>(({ className, required, children, ...props }, ref) => {
	const t = useTranslations("common");
	return (
		<LabelPrimitive.Root
			ref={ref}
			className={cn(labelVariants(), className)}
			{...props}
		>
			{children}
			{required && (
				<span className="ml-2 text-xs text-destructive font-medium border border-destructive rounded px-1">
					{t("required")}
				</span>
			)}
		</LabelPrimitive.Root>
	);
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
