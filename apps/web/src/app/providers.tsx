"use client";

import { SessionProvider } from "next-auth/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "../shared/ui/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<NuqsAdapter>
			<SessionProvider>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					{children}
				</ThemeProvider>
			</SessionProvider>
		</NuqsAdapter>
	);
}
