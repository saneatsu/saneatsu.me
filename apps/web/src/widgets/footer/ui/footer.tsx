"use client";

import { useTranslations } from "next-intl";
import { siGithub, siX } from "simple-icons";

import { Link } from "@/shared/lib";

export function Footer() {
	const t = useTranslations("footer");

	return (
		<footer className="border-t pb-20 md:pb-0">
			<div className="container mx-auto px-4">
				<div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
					<div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
						<p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
							{t("copyright", { year: new Date().getFullYear() })}
						</p>
					</div>
					<div className="flex items-center space-x-4 text-sm text-muted-foreground">
						<Link href="/privacy" className="hover:underline">
							{t("privacy")}
						</Link>
						<Link href="/terms" className="hover:underline">
							{t("terms")}
						</Link>
						<Link
							href="https://github.com/saneatsu/saneatsu.me"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 hover:underline"
							aria-label="GitHub"
						>
							<svg
								role="img"
								viewBox="0 0 24 24"
								className="h-4 w-4"
								fill="currentColor"
							>
								<title>GitHub</title>
								<path d={siGithub.path} />
							</svg>
							<span>GitHub</span>
						</Link>
						<Link
							href="https://x.com/saneatsu_wakana"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 hover:underline"
							aria-label="X"
						>
							<svg
								role="img"
								viewBox="0 0 24 24"
								className="h-4 w-4"
								fill="currentColor"
							>
								<title>X</title>
								<path d={siX.path} />
							</svg>
							<span>X</span>
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
