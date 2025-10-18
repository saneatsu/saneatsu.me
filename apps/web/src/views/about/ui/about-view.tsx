"use client";

import { useTranslations } from "next-intl";
import type { SimpleIcon } from "simple-icons";
import {
	siCloudflare,
	siDocker,
	siDrizzle,
	siGit,
	siGithub,
	siHono,
	siNextdotjs,
	siNodedotjs,
	siPostgresql,
	siReact,
	siSqlite,
	siTailwindcss,
	siTypescript,
	siVercel,
	siVite,
} from "simple-icons";

import { BadgeWithIcon } from "@/shared/ui";

/**
 * 技術アイテムの型定義
 */
type TechItem = {
	name: string;
	icon: SimpleIcon;
};

/**
 * Aboutページのメインビューコンポーネント
 *
 * @description
 * 技術スタック、経歴、連絡先情報を表示する。
 * 日英両言語に対応し、レスポンシブデザインを採用。
 */
export function AboutView() {
	const t = useTranslations("about");

	// 技術スタックの定義（アイコン付き）
	const techStack: {
		frontend: TechItem[];
		backend: TechItem[];
		tools: TechItem[];
	} = {
		frontend: [
			{ name: "React", icon: siReact },
			{ name: "Next.js", icon: siNextdotjs },
			{ name: "TypeScript", icon: siTypescript },
			{ name: "Tailwind CSS", icon: siTailwindcss },
			{ name: "Vite", icon: siVite },
		],
		backend: [
			{ name: "Node.js", icon: siNodedotjs },
			{ name: "Hono", icon: siHono },
			{ name: "Drizzle ORM", icon: siDrizzle },
			{ name: "PostgreSQL", icon: siPostgresql },
			{ name: "SQLite", icon: siSqlite },
		],
		tools: [
			{ name: "Git", icon: siGit },
			{ name: "GitHub", icon: siGithub },
			{ name: "Vercel", icon: siVercel },
			{ name: "Cloudflare", icon: siCloudflare },
			{ name: "Docker", icon: siDocker },
		],
	};

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto space-y-16">
				{/* タイトル */}
				<section className="text-center">
					<h1 className="text-4xl font-bold">{t("title")}</h1>
				</section>

				{/* コンテンツセクション */}
				<div className="space-y-12">
					{/* 技術セクション */}
					<section className="space-y-6 pb-12 border-b">
						<h2 className="text-2xl font-bold">{t("tech.title")}</h2>
						<div className="space-y-6">
							<div>
								<h3 className="text-lg font-semibold mb-3">
									{t("tech.frontend.title")}
								</h3>
								<div className="flex flex-wrap gap-2">
									{techStack.frontend.map((tech) => (
										<BadgeWithIcon
											key={tech.name}
											icon={tech.icon}
											text={tech.name}
										/>
									))}
								</div>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-3">
									{t("tech.backend.title")}
								</h3>
								<div className="flex flex-wrap gap-2">
									{techStack.backend.map((tech) => (
										<BadgeWithIcon
											key={tech.name}
											icon={tech.icon}
											text={tech.name}
										/>
									))}
								</div>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-3">
									{t("tech.tools.title")}
								</h3>
								<div className="flex flex-wrap gap-2">
									{techStack.tools.map((tech) => (
										<BadgeWithIcon
											key={tech.name}
											icon={tech.icon}
											text={tech.name}
										/>
									))}
								</div>
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

					{/* 連絡先セクション */}
					<section className="space-y-4">
						<h2 className="text-2xl font-bold">{t("contact.title")}</h2>
						<div className="space-y-2 text-muted-foreground">
							<p>
								GitHub:{" "}
								<a
									href="https://github.com/saneatsu"
									target="_blank"
									rel="noopener noreferrer"
									className="text-foreground hover:underline"
								>
									@saneatsu
								</a>
							</p>
							<p>
								X (Twitter):{" "}
								<a
									href="https://twitter.com/saneatsu_wakana"
									target="_blank"
									rel="noopener noreferrer"
									className="text-foreground hover:underline"
								>
									@saneatsu_wakana
								</a>
							</p>
							<p>
								Email:{" "}
								<a
									href="mailto:nito.tech.official@gmail.com"
									className="text-foreground hover:underline"
								>
									nito.tech.official@gmail.com
								</a>
							</p>
						</div>
					</section>
				</div>
			</div>
		</main>
	);
}
