"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { useGetById } from "@/entities/article";
import { useGetAllTags } from "@/entities/tag";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/shared/ui";

/**
 * パンくずリストのマッピング定義
 */
const breadcrumbMap: Record<string, string> = {
	"/admin": "ダッシュボード",
	"/admin/articles": "記事",
	"/admin/articles/new": "記事作成",
	"/admin/tags": "タグ",
	"/admin/tags/new": "タグ作成",
};

/**
 * パスから記事IDを抽出する
 */
function extractArticleId(pathname: string): number | null {
	const match = pathname.match(/^\/admin\/articles\/(\d+)(\/edit)?$/);
	return match ? Number.parseInt(match[1], 10) : null;
}

/**
 * パスからタグIDを抽出する
 */
function extractTagId(pathname: string): number | null {
	const match = pathname.match(/^\/admin\/tags\/(\d+)\/edit$/);
	return match ? Number.parseInt(match[1], 10) : null;
}

/**
 * パスからパンくずリストのデータを生成する
 */
function generateBreadcrumbs(
	pathname: string,
	articleTitle?: string | null,
	tagSlug?: string | null
) {
	const paths = pathname.split("/").filter(Boolean);
	const breadcrumbs = [];

	// /admin/articles/* と /admin/tags/* の場合はダッシュボードを表示しない
	const shouldShowDashboard =
		!pathname.startsWith("/admin/articles") &&
		!pathname.startsWith("/admin/tags");

	// ルートパス（ダッシュボード）
	if (shouldShowDashboard) {
		breadcrumbs.push({
			title: breadcrumbMap["/admin"] || "ダッシュボード",
			href: "/admin",
			isCurrentPage: pathname === "/admin",
		});
	}

	// /admin/articles/{id}/edit の場合は特別処理
	const articleId = extractArticleId(pathname);
	if (articleId) {
		// 「記事」を追加
		breadcrumbs.push({
			title: "記事",
			href: "/admin/articles",
			isCurrentPage: false,
		});

		// 記事タイトルを追加
		breadcrumbs.push({
			title: articleTitle || "読み込み中...",
			href: pathname.replace("/edit", ""),
			isCurrentPage: true,
		});

		return breadcrumbs;
	}

	// /admin/tags/{id}/edit の場合は特別処理
	const tagId = extractTagId(pathname);
	if (tagId) {
		// 「タグ」を追加
		breadcrumbs.push({
			title: "タグ",
			href: "/admin/tags",
			isCurrentPage: false,
		});

		// タグスラッグを追加
		breadcrumbs.push({
			title: tagSlug || "読み込み中...",
			href: pathname,
			isCurrentPage: true,
		});

		return breadcrumbs;
	}

	// パスを段階的に構築してパンくずリストを生成
	let currentPath = "";
	for (let i = 0; i < paths.length; i++) {
		currentPath += `/${paths[i]}`;

		// 管理画面のルート以外の場合
		if (currentPath !== "/admin") {
			const title = breadcrumbMap[currentPath] || paths[i];
			const isCurrentPage = currentPath === pathname;

			breadcrumbs.push({
				title,
				href: currentPath,
				isCurrentPage,
			});
		}
	}

	return breadcrumbs;
}

/**
 * 管理画面用のパンくずリストコンポーネント
 */
export function BreadcrumbWrapper() {
	const pathname = usePathname();
	const articleId = extractArticleId(pathname);
	const tagId = extractTagId(pathname);

	// 記事編集ページの場合、記事データを取得
	const { data: articleData } = useGetById(articleId || 0, {
		enabled: !!articleId,
		language: "ja",
	});

	// タグ編集ページの場合、タグデータを取得
	const { data: tagsData } = useGetAllTags({
		queryConfig: {
			enabled: !!tagId,
		},
	});

	const tag = tagsData?.data.find((t) => t.id === tagId);

	const breadcrumbs = generateBreadcrumbs(
		pathname,
		articleData?.title,
		tag?.slug
	);

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbs.map((breadcrumb, index) => (
					<React.Fragment key={breadcrumb.href}>
						<BreadcrumbItem>
							{breadcrumb.isCurrentPage ? (
								<BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
							) : (
								<BreadcrumbLink asChild>
									<Link href={breadcrumb.href}>{breadcrumb.title}</Link>
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
						{index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
