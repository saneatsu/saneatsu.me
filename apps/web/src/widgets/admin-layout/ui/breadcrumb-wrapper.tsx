"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

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
};

/**
 * パスからパンくずリストのデータを生成する
 */
function generateBreadcrumbs(pathname: string) {
	const paths = pathname.split("/").filter(Boolean);
	const breadcrumbs = [];

	// ルートパス（ダッシュボード）
	breadcrumbs.push({
		title: breadcrumbMap["/admin"] || "ダッシュボード",
		href: "/admin",
		isCurrentPage: pathname === "/admin",
	});

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
	const breadcrumbs = generateBreadcrumbs(pathname);

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
