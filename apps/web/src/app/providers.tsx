"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";

import { queryConfig } from "@/shared/lib";
import { ThemeProvider, Toaster } from "@/shared/ui";

export function Providers({ children }: { children: React.ReactNode }) {
	// QueryClientをuseStateで管理（SSR対応）
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: queryConfig,
			})
	);

	return (
		<NuqsAdapter>
			<QueryClientProvider client={queryClient}>
				<SessionProvider>
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
						{children}
						<Toaster expand={true} />
					</ThemeProvider>
				</SessionProvider>
			</QueryClientProvider>
		</NuqsAdapter>
	);
}
