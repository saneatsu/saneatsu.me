"use client";

import { Check, Link } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { siFacebook, siX } from "simple-icons";
import { toast } from "sonner";

import { cn } from "@/shared/lib";

/**
 * ShareButtonsコンポーネントのプロパティ
 */
export interface ShareButtonsProps {
	/** シェアするURL */
	url: string;
	/** シェアするタイトル */
	title: string;
	/** 追加のCSSクラス */
	className?: string;
}

/**
 * SNSシェアURLを生成する関数群
 */
const createShareUrls = (url: string, title: string) => ({
	/**
	 * X（旧Twitter）のシェアURLを生成
	 */
	x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,

	/**
	 * Facebookのシェアラ URLを生成
	 */
	facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,

	/**
	 * はてなブックマークのシェアURLを生成
	 */
	hatena: `https://b.hatena.ne.jp/entry/${encodeURIComponent(url)}`,
});

/**
 * SNSシェアボタンコンポーネント
 *
 * @description
 * X、Facebook、はてなブックマークへのシェアボタンを表示する。
 * アイコンのみのコンパクトなデザインで、ホバー時に各SNSのブランドカラーに変化する。
 *
 * 機能：
 * - X（旧Twitter）シェア
 * - Facebookシェア
 * - はてなブックマーク追加
 * - 新しいタブで開く
 * - レスポンシブデザイン対応
 *
 * @example
 * ```tsx
 * <ShareButtons
 *   url="https://example.com/article"
 *   title="記事のタイトル"
 * />
 * ```
 */
export function ShareButtons({ url, title, className }: ShareButtonsProps) {
	const shareUrls = createShareUrls(url, title);
	const t = useTranslations("share");
	const [isCopied, setIsCopied] = useState(false);

	// 共通のボタンスタイル
	const buttonClassName =
		"flex h-10 w-10 items-center justify-center bg-background rounded-md transition-colors";

	/**
	 * リンクをクリップボードにコピーする
	 */
	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setIsCopied(true);
			toast.success(t("copyLink"));

			// 2秒後にアイコンを元に戻す
			setTimeout(() => {
				setIsCopied(false);
			}, 2000);
		} catch {
			toast.error(t("copyLinkError"));
		}
	};

	return (
		<div className={cn("flex items-center gap-2", className)}>
			{/* リンクコピーボタン */}
			<button
				type="button"
				onClick={handleCopyLink}
				className={cn(buttonClassName, "hover:text-blue-500 cursor-pointer")}
				aria-label="Copy link"
			>
				{isCopied ? (
					<Check className="h-4 w-4 text-success" />
				) : (
					<Link className="h-4 w-4" />
				)}
			</button>

			{/* Xシェアボタン */}
			<a
				href={shareUrls.x}
				target="_blank"
				rel="noopener noreferrer"
				className={cn(
					buttonClassName,
					"hover:text-black dark:hover:text-white"
				)}
				aria-label="Share on X"
			>
				<svg
					role="img"
					viewBox="0 0 24 24"
					className="h-4 w-4"
					fill="currentColor"
					aria-label={siX.title}
				>
					<title>{siX.title}</title>
					<path d={siX.path} />
				</svg>
			</a>

			{/* Facebookシェアボタン */}
			<a
				href={shareUrls.facebook}
				target="_blank"
				rel="noopener noreferrer"
				className={cn(buttonClassName, "hover:text-[#1877F2]")}
				aria-label="Share on Facebook"
			>
				<svg
					role="img"
					viewBox="0 0 24 24"
					className="h-5 w-5"
					fill="currentColor"
					aria-label={siFacebook.title}
				>
					<title>{siFacebook.title}</title>
					<path d={siFacebook.path} />
				</svg>
			</a>

			{/* はてなブックマークボタン */}
			<a
				href={shareUrls.hatena}
				target="_blank"
				rel="noopener noreferrer"
				className={cn(
					buttonClassName,
					"hover:text-[#00A4DE] font-bold text-base"
				)}
				aria-label="Add to Hatena Bookmark"
			>
				B!
			</a>
		</div>
	);
}
