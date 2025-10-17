"use client";

import { Github, Mail, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button/button";

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
		<main className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto space-y-16">
				{/* プロフィールセクション */}
				<section className="text-center space-y-4">
					<h1 className="text-4xl font-bold">{t("profile.title")}</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						{t("profile.description")}
					</p>
				</section>

				{/* コンテンツセクション */}
				<div className="space-y-12">
					{/* 技術セクション */}
					<section className="space-y-4 pb-12 border-b">
						<div>
							<h2 className="text-2xl font-bold mb-2">{t("tech.title")}</h2>
							<p className="text-muted-foreground">{t("tech.description")}</p>
						</div>
						<div className="space-y-6">
							<div>
								<h3 className="text-lg font-semibold mb-2">
									{t("tech.frontend.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("tech.frontend.skills")}
								</p>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-2">
									{t("tech.backend.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("tech.backend.skills")}
								</p>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-2">
									{t("tech.tools.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("tech.tools.skills")}
								</p>
							</div>
						</div>
					</section>

					{/* 経歴セクション */}
					<section className="space-y-4 pb-12 border-b">
						<div>
							<h2 className="text-2xl font-bold mb-2">
								{t("experience.title")}
							</h2>
							<p className="text-muted-foreground">
								{t("experience.description")}
							</p>
						</div>
						<div className="space-y-6">
							<div>
								<h3 className="text-lg font-semibold mb-2">
									{t("experience.current.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("experience.current.description")}
								</p>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-2">
									{t("experience.focus.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("experience.focus.description")}
								</p>
							</div>
						</div>
					</section>

					{/* 趣味・関心事セクション */}
					<section className="space-y-4 pb-12 border-b">
						<div>
							<h2 className="text-2xl font-bold mb-2">
								{t("interests.title")}
							</h2>
							<p className="text-muted-foreground">
								{t("interests.description")}
							</p>
						</div>
						<div className="space-y-6">
							<div>
								<h3 className="text-lg font-semibold mb-2">
									{t("interests.tech.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("interests.tech.description")}
								</p>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-2">
									{t("interests.life.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("interests.life.description")}
								</p>
							</div>
						</div>
					</section>

					{/* 連絡先セクション */}
					<section className="space-y-4">
						<div>
							<h2 className="text-2xl font-bold mb-2">{t("contact.title")}</h2>
							<p className="text-muted-foreground">
								{t("contact.description")}
							</p>
						</div>
						<div className="flex flex-col space-y-3 max-w-sm">
							<Button
								variant="outline"
								className="justify-start"
								onClick={() =>
									window.open("https://github.com/saneatsu", "_blank")
								}
							>
								<Github className="mr-2 h-4 w-4" />
								GitHub
							</Button>
							<Button
								variant="outline"
								className="justify-start"
								onClick={() =>
									window.open("https://twitter.com/saneatsu", "_blank")
								}
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
					</section>
				</div>
			</div>
		</main>
	);
}
