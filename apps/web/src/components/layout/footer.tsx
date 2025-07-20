import Link from "next/link";

export function Footer() {
	return (
		<footer className="border-t">
			<div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
				<div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
					<p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
						© 2024 Saneatsu. All rights reserved.
					</p>
				</div>
				<div className="flex items-center space-x-4 text-sm text-muted-foreground">
					<Link href="/privacy" className="hover:underline">
						Privacy Policy
					</Link>
					<Link href="/terms" className="hover:underline">
						Terms of Service
					</Link>
					<Link
						href="https://github.com/saneatsu"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:underline"
					>
						GitHub
					</Link>
				</div>
			</div>
		</footer>
	);
}