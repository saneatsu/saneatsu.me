"use client";

import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemeProvider } from "next-themes";

/**
 * テーマ（ライト/ダーク）プロバイダー
 *
 * @description
 * next-themes の ThemeProvider をそのままラップする。
 *
 * 以前は `mounted` フラグでクライアント描画後にのみ描画していたが、それだと
 * next-themes がちらつき防止のために差し込む <script> がクライアント描画時に
 * 初めてReactツリーへ現れ、「Scripts inside React components are never executed」
 * という警告が出ていた。layout.tsx の <html suppressHydrationWarning> で
 * ハイドレーション差分は吸収されるため、ゲートを外してSSRから素直に描画する。
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return <NextThemeProvider {...props}>{children}</NextThemeProvider>;
}
