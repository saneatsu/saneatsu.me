"use client";

import { useTranslations } from "next-intl";

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
					</div>
				</div>
			</div>
		</footer>
	);
}
