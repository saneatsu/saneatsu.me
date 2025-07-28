"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";
import { queryConfig } from "../shared/lib/react-query";
import { ThemeProvider } from "../shared/ui/theme-provider";

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
					</ThemeProvider>
				</SessionProvider>
				{/* 開発環境でのみReact Query DevToolsを表示 */}
				{process.env.NODE_ENV === "development" && (
					<ReactQueryDevtools initialIsOpen={false} />
				)}
			</QueryClientProvider>
		</NuqsAdapter>
	);
}
