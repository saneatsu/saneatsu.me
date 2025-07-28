"use client";

import { Github, Mail, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "../../../shared/ui/button/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../shared/ui/card/card";

/**
 * Aboutページのメインビューコンポーネント
 *
 * @description
 * 自己紹介、技術的な興味、経歴、趣味・関心事、連絡先情報を表示する。
 * 日英両言語に対応し、レスポンシブデザインを採用。
 */
export function AboutView() {
	const t = useTranslations("about");

	return (
		<main className="container mx-auto px-4 py-8 space-y-12">
			{/* プロフィールセクション */}
			<section className="text-center space-y-4">
				<h1 className="text-4xl font-bold">{t("profile.title")}</h1>
				<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
					{t("profile.description")}
				</p>
			</section>

			{/* コンテンツグリッド */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* 技術セクション */}
				<Card>
					<CardHeader>
						<CardTitle>{t("tech.title")}</CardTitle>
						<CardDescription>{t("tech.description")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<h4 className="font-semibold mb-2">{t("tech.frontend.title")}</h4>
							<p className="text-sm text-muted-foreground">
								{t("tech.frontend.skills")}
							</p>
						</div>
						<div>
							<h4 className="font-semibold mb-2">{t("tech.backend.title")}</h4>
							<p className="text-sm text-muted-foreground">
								{t("tech.backend.skills")}
							</p>
						</div>
						<div>
							<h4 className="font-semibold mb-2">{t("tech.tools.title")}</h4>
							<p className="text-sm text-muted-foreground">
								{t("tech.tools.skills")}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* 経歴セクション */}
				<Card>
					<CardHeader>
						<CardTitle>{t("experience.title")}</CardTitle>
						<CardDescription>{t("experience.description")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<h4 className="font-semibold mb-2">
								{t("experience.current.title")}
							</h4>
							<p className="text-sm text-muted-foreground">
								{t("experience.current.description")}
							</p>
						</div>
						<div>
							<h4 className="font-semibold mb-2">
								{t("experience.focus.title")}
							</h4>
							<p className="text-sm text-muted-foreground">
								{t("experience.focus.description")}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* 趣味・関心事セクション */}
				<Card>
					<CardHeader>
						<CardTitle>{t("interests.title")}</CardTitle>
						<CardDescription>{t("interests.description")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<h4 className="font-semibold mb-2">
								{t("interests.tech.title")}
							</h4>
							<p className="text-sm text-muted-foreground">
								{t("interests.tech.description")}
							</p>
						</div>
						<div>
							<h4 className="font-semibold mb-2">
								{t("interests.life.title")}
							</h4>
							<p className="text-sm text-muted-foreground">
								{t("interests.life.description")}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* 連絡先セクション */}
				<Card>
					<CardHeader>
						<CardTitle>{t("contact.title")}</CardTitle>
						<CardDescription>{t("contact.description")}</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col space-y-3">
							<Button
								variant="outline"
								className="justify-start"
								onClick={() => window.open("https://github.com/saneatsu", "_blank")}
							>
								<Github className="mr-2 h-4 w-4" />
								GitHub
							</Button>
							<Button
								variant="outline"
								className="justify-start"
								onClick={() => window.open("https://twitter.com/saneatsu", "_blank")}
							>
								<Twitter className="mr-2 h-4 w-4" />
								Twitter
							</Button>
							<Button
								variant="outline"
								className="justify-start"
								onClick={() => window.open("mailto:hello@saneatsu.me")}
							>
								<Mail className="mr-2 h-4 w-4" />
								{t("contact.email")}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
